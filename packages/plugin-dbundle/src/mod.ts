/**
 * Fresh plugin for dbundle.
 *
 * Replaces @fresh/plugin-vite for use with the dbundle bundler.
 * Handles virtual modules, Deno module resolution, and island/route discovery.
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

function fromFileUrl(url: string): string {
  if (url.startsWith("file:///")) return url.slice("file://".length);
  if (url.startsWith("file://")) return url.slice("file://".length);
  return url;
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

  // console.log(root);

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
  const islands = new Map<string, { name: string; chunk: string | null }>();
  const islandSpecByName = new Map<string, string>();
  const routeNamer = new UniqueNamer();
  const routeFileToName = new Map<string, string>();
  // deno-lint-ignore no-explicit-any
  const routes: Map<string, FsRouteFileNoMod<any>> = new Map();

  // Track warned specifiers to avoid spam
  const warnedSpecifiers = new Set<string>();

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
      islands.set(spec, { name, chunk: null });
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

    // The config hook can return partial config to merge
    async config(_resolvedConfig: Record<string, unknown>) {
      await ensureCrawled();

      // Add island files as additional client entries
      const islandEntries: string[] = [];
      for (const [_spec, def] of islands) {
        islandEntries.push(`fresh-client-island::${def.name}`);
      }

      return {
        environments: {
          client: {
            entry: [
              "fresh:client-entry",
              ...islandEntries,
            ],
          },
        },
      };
    },

    async setup(build: PluginBuild) {
      // ------------------------------------------------------------------
      // Virtual module resolvers
      // ------------------------------------------------------------------

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

      // fresh-client-island::* → resolve to the actual island file on disk
      build.onResolve({ filter: /^fresh-client-island::/ }, (args) => {
        let name = args.specifier.slice("fresh-client-island::".length);
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

          // Append HTTP server startup for dbundle's module runner
          code += `
// Start HTTP server for dbundle's module runner
const port = Number(Deno.env.get("DBUNDLE_SERVER_PORT") ?? "8000");
Deno.serve({ port, hostname: "127.0.0.1" }, app.handler());
if (import.meta.hot) import.meta.hot.accept();
`;

          return { text: code, loader: "js" };
        },
      );

      // fresh:server-snapshot
      build.onLoad(
        { filter: /^fresh:server-snapshot$/, namespace: "fresh" },
        async () => {
          await ensureCrawled();

          const islandMods: IslandModChunk[] = Array.from(
            islands.entries(),
          ).map(([id, def]) => ({
            name: def.name,
            server: id,
            browser: def.chunk ?? `/@id/fresh-island::${def.name}`,
            css: [],
          }));

          const code = await generateSnapshotServer({
            outDir: root,
            staticFiles: [],
            buildId: "",
            clientEntry: "/@id/fresh:client-entry",
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
