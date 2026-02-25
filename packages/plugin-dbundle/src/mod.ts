/**
 * Fresh plugin for dbundle.
 *
 * Replaces @fresh/plugin-vite for use with the dbundle bundler.
 * Handles virtual modules, Deno module resolution, and island/route discovery.
 *
 * Uses import attributes (`with { type: "url", env: "client" }`) to make
 * cross-environment dependencies (islands, client entry) visible to the
 * bundler. The bundler automatically registers referenced modules as client
 * entries and resolves the import bindings to chunk URLs at emit time.
 */

import {
  crawlFsItem,
  type FsRouteFileNoMod,
  generateServerEntry,
  generateSnapshotServer,
  type IslandModChunk,
  specToName,
  TEST_FILE_PATTERN,
  UniqueNamer,
} from "fresh/internal-dev";

// ============================================================================
// Inline path utilities (avoids @std/path dependency in config harness context)
// ============================================================================

function isAbsolute(p: string): boolean {
  return p.startsWith("/");
}

function join(...parts: string[]): string {
  const joined = parts.join("/");
  // Normalize: collapse multiple slashes, resolve . and ..
  const segments: string[] = [];
  for (const seg of joined.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (
      seg === ".." && segments.length > 0 &&
      segments[segments.length - 1] !== ".."
    ) {
      segments.pop();
    } else {
      segments.push(seg);
    }
  }
  return (joined.startsWith("/") ? "/" : "") + segments.join("/");
}

function toFileUrl(p: string): string {
  return "file://" + p;
}

// ============================================================================
// Build ID
// ============================================================================

async function getBuildId(dev: boolean): Promise<string> {
  const gitRevision = Deno.env.get("DENO_DEPLOYMENT_ID") ??
    Deno.env.get("DENO_DEPLOY_BUILD_ID") ??
    Deno.env.get("GITHUB_SHA") ??
    Deno.env.get("CI_COMMIT_SHA");
  if (gitRevision !== undefined) {
    return gitRevision.trim();
  }

  if (!dev) {
    try {
      const bin = Deno.build.os === "windows" ? "git.exe" : "git";
      const res = await new Deno.Command(bin, { args: ["rev-parse", "HEAD"] })
        .output();
      return new TextDecoder().decode(res.stdout).trim();
    } catch {
      // ignore
    }
  }

  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0]).trim();
}

// ============================================================================
// Types
// ============================================================================

export interface FreshPluginConfig {
  /** Path to main server entry file. Default: "main.ts" */
  serverEntry?: string;
  /** Path to main client entry file. Default: "client.ts" */
  clientEntry?: string;
  /** Path to islands directory. Default: "./islands" */
  islandsDir?: string;
  /** Path to routes directory. Default: "./routes" */
  routeDir?: string;
  /** Patterns to ignore when crawling. Default: [TEST_FILE_PATTERN] */
  ignore?: RegExp[];
}

interface ResolvedConfig {
  serverEntry: string;
  clientEntry: string;
  islandsDir: string;
  routeDir: string;
  ignore: RegExp[];
  namer: UniqueNamer;
}

// deno-lint-ignore no-explicit-any
interface PluginBuild {
  onResolve(
    options: { filter: RegExp; namespace?: string },
    callback: (args: {
      specifier: string;
      importer: string;
      namespace: string;
      kind: string;
      resolveDir: string;
      // deno-lint-ignore no-explicit-any
    }) => any,
  ): void;
  onLoad(
    options: { filter: RegExp; namespace?: string },
    callback: (args: {
      path: string;
      namespace: string;
      // deno-lint-ignore no-explicit-any
    }) => any,
  ): void;
  onTransform(
    options: { filter: RegExp; namespace?: string },
    callback: (args: {
      text: string;
      path: string;
      namespace: string;
      loader: string;
      // deno-lint-ignore no-explicit-any
    }) => any,
  ): void;
}

// ============================================================================
// Plugin
// ============================================================================

/**
 * Create a Fresh plugin for dbundle.
 *
 * @example
 * ```ts
 * // dbundle.config.ts
 * import { freshPlugin } from "@fresh/plugin-dbundle";
 *
 * export default {
 *   environments: { ... },
 *   plugins: [freshPlugin()],
 * };
 * ```
 */
export function freshPlugin(config?: FreshPluginConfig) {
  const root = Deno.env.get("DBUNDLE_ROOT") ?? Deno.cwd();

  const resolved: ResolvedConfig = {
    serverEntry: config?.serverEntry ?? "main.ts",
    clientEntry: config?.clientEntry ?? "client.ts",
    islandsDir: config?.islandsDir ?? "islands",
    routeDir: config?.routeDir ?? "routes",
    ignore: config?.ignore ?? [TEST_FILE_PATTERN],
    namer: new UniqueNamer(),
  };

  // Resolve paths relative to root
  const serverEntry = isAbsolute(resolved.serverEntry)
    ? resolved.serverEntry
    : join(root, resolved.serverEntry);
  const clientEntry = isAbsolute(resolved.clientEntry)
    ? resolved.clientEntry
    : join(root, resolved.clientEntry);
  const islandsDir = isAbsolute(resolved.islandsDir)
    ? resolved.islandsDir
    : join(root, resolved.islandsDir);
  const routeDir = isAbsolute(resolved.routeDir)
    ? resolved.routeDir
    : join(root, resolved.routeDir);

  // State populated during setup
  const islands = new Map<string, { name: string }>();
  const islandSpecByName = new Map<string, string>();
  const routeNamer = new UniqueNamer();
  const routeFileToName = new Map<string, string>();
  // deno-lint-ignore no-explicit-any
  const routes: Map<string, FsRouteFileNoMod<any>> = new Map();

  // Whether FS has been crawled
  let crawled = false;

  async function ensureCrawled() {
    if (crawled) return;
    crawled = true;

    const result = await crawlFsItem({
      islandDir: islandsDir,
      routeDir: routeDir,
      ignore: resolved.ignore,
    });

    for (const spec of result.islands) {
      const specName = specToName(spec);
      const name = resolved.namer.getUniqueName(specName);
      islands.set(spec, { name });
      islandSpecByName.set(name, spec);
    }

    for (const route of result.routes) {
      const name = routeNamer.getUniqueName(route.id);
      routeFileToName.set(route.filePath, name);
      routes.set(name, route);
    }
  }

  return {
    name: "fresh",

    async setup(build: PluginBuild) {
      // Compute build ID once for use in hooks
      const buildId = await getBuildId(false);

      // ------------------------------------------------------------------
      // Virtual module resolvers
      // ------------------------------------------------------------------

      // @fresh/build-id → virtual module
      build.onResolve(
        { filter: /^(jsr:)?@fresh\/build-id(@.*)?$/ },
        () => ({ path: "fresh:build-id", namespace: "fresh" }),
      );

      // fresh:client-entry
      build.onResolve(
        { filter: /^fresh:client-entry$/ },
        () => ({ path: "fresh:client-entry", namespace: "fresh" }),
      );

      // fresh:server-entry
      build.onResolve(
        { filter: /^fresh:server-entry$/ },
        () => ({ path: "fresh:server-entry", namespace: "fresh" }),
      );

      // fresh:server-snapshot
      build.onResolve(
        { filter: /^fresh:server-snapshot$/ },
        () => ({ path: "fresh:server-snapshot", namespace: "fresh" }),
      );

      // fresh-island::* → resolve to the actual island file on disk
      build.onResolve({ filter: /^fresh-island::/ }, (args) => {
        let name = args.specifier.slice("fresh-island::".length);
        const extIdx = name.lastIndexOf(".");
        if (extIdx > 0) name = name.slice(0, extIdx);

        const spec = islandSpecByName.get(name);
        if (spec) return { path: spec };
        return null;
      });

      // fresh-route::* → virtual module
      build.onResolve({ filter: /^fresh-route::/ }, (args) => {
        let name = args.specifier.slice("fresh-route::".length);
        const extIdx = name.lastIndexOf(".");
        if (extIdx > 0) name = name.slice(0, extIdx);
        return { path: `fresh-route::${name}`, namespace: "fresh" };
      });

      // fresh-route-css::* → virtual module
      build.onResolve({ filter: /^fresh-route-css::/ }, (args) => {
        let name = args.specifier.slice("fresh-route-css::".length);
        const idx = name.indexOf(".module.");
        if (idx > -1) name = name.slice(0, idx);
        return { path: `fresh-route-css::${name}`, namespace: "fresh" };
      });

      // ------------------------------------------------------------------
      // Virtual module loaders (namespace: "fresh")
      // ------------------------------------------------------------------

      // @fresh/build-id
      build.onLoad(
        { filter: /^fresh:build-id$/, namespace: "fresh" },
        () => ({
          text: `export let BUILD_ID = ${JSON.stringify(buildId)};
export const DENO_DEPLOYMENT_ID = undefined;
export function setBuildId(id) {
  BUILD_ID = id;
}`,
          loader: "js",
        }),
      );

      // fresh:client-entry
      build.onLoad(
        { filter: /^fresh:client-entry$/, namespace: "fresh" },
        async () => {
          let exists = false;
          try {
            const stat = await Deno.stat(clientEntry);
            exists = stat.isFile;
          } catch {
            exists = false;
          }

          const code = [
            `export * from "fresh/runtime-client";`,
            exists ? `import ${JSON.stringify(clientEntry)};` : "",
          ]
            .filter(Boolean)
            .join("\n");

          return { text: code, loader: "js" };
        },
      );

      // fresh:server-entry
      build.onLoad(
        { filter: /^fresh:server-entry$/, namespace: "fresh" },
        async () => {
          await ensureCrawled();

          let code = generateServerEntry({
            root,
            serverEntry: toFileUrl(serverEntry),
            snapshotSpecifier: "fresh:server-snapshot",
          });

          console.log(code);

          // Append HTTP server startup for dbundle's module runner.
          // Uses import.meta.hot.dispose/data to keep Deno.serve alive across
          // HMR updates — only the request handler is swapped.
          code += `
const __handler = app.handler();
if (import.meta.hot) {
  const __ref = import.meta.hot.data?.handlerRef ?? { current: null };
  __ref.current = __handler;
  if (!import.meta.hot.data?.handlerRef) {
    const __port = Number(Deno.env.get("DBUNDLE_SERVER_PORT") ?? "8000");
    Deno.serve({ port: __port, hostname: "127.0.0.1" }, (req, info) => __ref.current(req, info));
  }
  import.meta.hot.dispose((data) => { data.handlerRef = __ref; });
  import.meta.hot.accept();
} else {
  const __port = Number(Deno.env.get("DBUNDLE_SERVER_PORT") ?? "8000");
  Deno.serve({ port: __port, hostname: "127.0.0.1" }, __handler);
}
`;

          return { text: code, loader: "js" };
        },
      );

      // fresh:server-snapshot
      build.onLoad(
        { filter: /^fresh:server-snapshot$/, namespace: "fresh" },
        async () => {
          await ensureCrawled();

          // Build URL reference imports for the client entry and each island.
          // These use `with { type: "url", env: "client" }` so the bundler:
          //   1. Registers each module as a client environment entry
          //   2. Resolves the import binding to the chunk URL at emit time
          const urlImportLines: string[] = [];
          const CLIENT_ENTRY_PLACEHOLDER = "__FRESH_URL_CLIENT_ENTRY__";
          const clientUrlVar = "__fresh_url_client_entry";
          urlImportLines.push(
            `import ${clientUrlVar} from "fresh:client-entry" with { type: "url", env: "client" };`,
          );

          // Map island name → { varName, placeholder } for post-processing
          const islandPlaceholders = new Map<
            string,
            { varName: string; placeholder: string }
          >();
          for (const [spec, def] of islands) {
            const varName = `__fresh_url_${def.name}`;
            const placeholder = `__FRESH_URL_ISLAND_${def.name}__`;
            islandPlaceholders.set(def.name, { varName, placeholder });
            urlImportLines.push(
              `import ${varName} from ${
                JSON.stringify(spec)
              } with { type: "url", env: "client" };`,
            );
          }

          // Pass placeholder strings as `browser` values. generateSnapshotServer
          // wraps them with JSON.stringify, producing `"__FRESH_URL_ISLAND_X__"`
          // in the output. We replace those string literals with the variable
          // references below.
          const islandMods: IslandModChunk[] = Array.from(
            islands.entries(),
          ).map(([id, def]) => ({
            name: def.name,
            server: id,
            browser: islandPlaceholders.get(def.name)!.placeholder,
            css: [],
          }));

          let code = await generateSnapshotServer({
            outDir: root,
            staticFiles: [],
            buildId: "",
            clientEntry: CLIENT_ENTRY_PLACEHOLDER,
            entryAssets: [],
            fsRoutesFiles: Array.from(routes.values()),
            islands: islandMods,
            writeSpecifier: (file: string) => {
              const def = islands.get(file);
              if (def) return `fresh-island::${def.name}`;

              const routeDef = routeFileToName.get(file);
              if (routeDef !== undefined) return `fresh-route::${routeDef}`;

              return toFileUrl(file);
            },
          });

          // Replace quoted placeholder strings with variable references
          code = code.replace(
            JSON.stringify(CLIENT_ENTRY_PLACEHOLDER),
            clientUrlVar,
          );
          for (const [, { varName, placeholder }] of islandPlaceholders) {
            code = code.replaceAll(JSON.stringify(placeholder), varName);
          }

          // Prepend the URL reference imports
          code = urlImportLines.join("\n") + "\n" + code;

          return { text: code, loader: "js" };
        },
      );

      // fresh-route::* loader
      build.onLoad(
        { filter: /^fresh-route::/, namespace: "fresh" },
        (args) => {
          const name = args.path.slice("fresh-route::".length);
          const route = routes.get(name);
          if (!route) return null;

          const fileUrl = toFileUrl(route.filePath);
          const cssId = `fresh-route-css::${name}.module.css`;

          const code = `import * as mod from "${fileUrl}";
import routeCss from "${cssId}";
export const css = routeCss;
export const config = mod.config;
export const handler = mod.handler;
export const handlers = mod.handlers;
export default mod.default;
`;

          return { text: code, loader: "js" };
        },
      );

      // fresh-route-css::* loader
      build.onLoad(
        { filter: /^fresh-route-css::/, namespace: "fresh" },
        (args) => {
          const name = args.path.slice("fresh-route-css::".length);
          const route = routes.get(name);
          if (!route) return null;

          const imports = (route.css ?? [])
            .map((css: string) => `import "${css}";`)
            .join("\n");
          const code = `${imports}
export default ${JSON.stringify(route.css ?? [])}
`;

          return { text: code, loader: "js" };
        },
      );
    },
  };
}
