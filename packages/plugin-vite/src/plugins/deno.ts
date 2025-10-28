import type { Plugin, ResolvedConfig } from "vite";
import {
  type Loader,
  MediaType,
  RequestedModuleType,
  ResolutionMode,
  Workspace,
} from "@deno/loader";
import * as path from "@std/path";
import * as babel from "@babel/core";
import { httpAbsolute } from "./patches/http_absolute.ts";
import { JS_REG, JSX_REG } from "../utils.ts";
import { builtinModules } from "node:module";
import {
  type BundleFile,
  bundleNpmPackage,
  readPackageJson,
  reverseLookupNpm,
} from "./npm.ts";
import { SpecMeta } from "./patches/bare_specifier.ts";
import { SHIMS } from "./shims.ts";

// @ts-ignore Workaround for https://github.com/denoland/deno/issues/30850
const { default: babelReact } = await import("@babel/preset-react");

const BUILTINS = new Set(builtinModules);
const NPM_PKG_NAME = /^(@[^/]+\/[^@/]+|[^@][^/@]+)/;

export function deno(): Plugin {
  let ssrLoader: Loader;
  let browserLoader: Loader;

  let isDev = false;

  const npmCache = new Map<string, BundleFile>();
  const npmPending = new Map<string, Promise<void>>();
  // deno-lint-ignore no-explicit-any
  let viteConfig: ResolvedConfig = {} as any;

  return {
    name: "deno",
    sharedDuringBuild: true,
    // We must be first to be able to resolve before the
    // Vite's own`vite:resolve` plugin. It always treats bare
    // specifiers as external during SSR.
    enforce: "pre",
    config(_, env) {
      isDev = env.command === "serve";
    },
    async configResolved(config) {
      viteConfig = config;

      // TODO: Pass conditions
      ssrLoader = await new Workspace({
        platform: "node",
        debug: true,
        cachedOnly: true,
        nodeConditions: [
          "deno",
          "import",
          "module",
          "node",
          isDev ? "development" : "production",
          "default",
        ],
      }).createLoader();
      browserLoader = await new Workspace({
        platform: "browser",
        nodeConditions: [
          "import",
          "module",
          "browser",
          isDev ? "development" : "production",
          "default",
        ],
        debug: true,
        preserveJsx: true,
        cachedOnly: true,
      })
        .createLoader();
    },
    applyToEnvironment() {
      return true;
    },
    options() {
      const viteResolve = this.environment.plugins.find((plugin) =>
        plugin.name === "vite:resolve"
      );

      if (viteResolve) {
        viteResolve.resolveId = () => undefined;
        viteResolve.load = () => undefined;
      }
    },
    async resolveId(id, importer, options) {
      const loader = options?.ssr ? ssrLoader : browserLoader;
      const platform = options?.ssr ? "ssr" : "browser";

      if (id.startsWith("\0deno-resolve::")) {
        id = id.slice("\0deno-resolve::".length);

        if (
          importer?.startsWith("\0deno-npm::") && !id.startsWith("deno-npm::")
        ) {
          const importerId = importer.slice("\0deno-npm::".length);
          const chunk = npmCache.get(importerId);
          if (chunk !== undefined) {
            importer = chunk.filePath;
          }
        }
      }

      if (BUILTINS.has(id)) {
        // `node:` prefix is not included in builtins list.
        if (!id.startsWith("node:")) {
          id = `node:${id}`;
        }
        return {
          id,
          external: true,
        };
      }

      if (id.startsWith("/@fs/")) {
        id = id.slice("/@fs".length);

        console.log({ FS: id });
      }

      const original = id;

      let isHttp = false;
      if (id.startsWith("deno-http::")) {
        isHttp = true;
        id = id.slice("deno-http::".length);
      }

      importer = isDenoSpecifier(importer)
        ? parseDenoSpecifier(importer).specifier
        : importer;

      if (id.startsWith("/") && importer && /^https?:\/\//g.test(importer)) {
        const url = new URL(importer);
        id = `${url.origin}${id}`;
      }

      // We still want to allow other plugins to participate in
      // resolution, with us being in front due to `enforce: "pre"`.
      // But we still want to ignore everything `vite:resolve` does
      // because we're kinda replacing that plugin here.
      if (!id.startsWith("npm:")) {
        console.log("MAYBE2", id);
        const tmp = await this.resolve(id, importer, options);
        if (tmp && tmp.resolvedBy !== "vite:resolve") {
          if (tmp.external && !/^https?:\/\//.test(tmp.id)) {
            console.log("ABORT #1", tmp);
            return tmp;
          }

          // A plugin namespaced it, we should not attempt to resolve it.
          if (tmp.id.startsWith("\0")) {
            console.log("ABORT #2", tmp);
            return tmp;
          }

          id = tmp.id;
        }
      }

      // Plugins may return lower cased drive letters on windows
      if (!isHttp && path.isAbsolute(id)) {
        console.log("ABS #1", { id });
        id = path.toFileUrl(path.normalize(id))
          .href;
      }

      if (id.startsWith("deno-npm::")) {
        const chunkId = id.slice("deno-npm::".length);
        const chunk = npmCache.get(chunkId);

        if (chunk === undefined) {
          console.log(npmCache.keys());
          throw new Error(
            `Missing chunk for ${chunkId}. This is a bug in Fresh.`,
          );
        }

        return {
          id: `\0deno-npm::${chunkId}`,
        };
      } else if (id.startsWith("\0deno-npm::")) {
        return id;
      }

      try {
        // Ensure we're passing a valid importer that Deno understands
        const denoImporter = importer && !importer.startsWith("\0")
          ? importer
          : undefined;

        let resolved = await loader.resolve(
          id,
          denoImporter,
          ResolutionMode.Import,
        );

        console.log({ id, resolved, denoImporter });

        if (resolved.startsWith("node:")) {
          return {
            id: resolved,
            external: true,
          };
        }

        // Load npm bundle if it's an npm specifier.
        const nodeIdx = resolved.lastIndexOf("/node_modules/");
        npmOptimize: if (nodeIdx > -1 && JS_REG.test(resolved)) {
          const endIdx = nodeIdx + "/node_modules/".length;
          const part = resolved.slice(endIdx);
          const match = part.match(NPM_PKG_NAME);
          console.log("MAYBE NPM", platform, { part, match });
          if (match === null) {
            throw new Error(
              `Unable to detect npm package from path: ${resolved}`,
            );
          }

          const pkg = match[1];
          const fileDir = resolved.slice(0, endIdx + pkg.length);
          const dir = path.fromFileUrl(fileDir);

          console.log(path.join(dir, "package.json"));
          const pkgJson = await readPackageJson(
            path.join(dir, "package.json"),
          );
          console.log({ pkg: pkgJson.name });

          const shimmed = SHIMS[pkgJson.name];
          if (shimmed !== undefined) {
            return shimmed;
          }

          let cacheKey = reverseLookupNpm(pkgJson, dir, resolved);
          if (cacheKey === undefined) {
            console.log("REVERSE lookup failed", resolved);
            break npmOptimize;
          }
          cacheKey = `${platform}__${cacheKey}`;

          if (pkg === "vite") {
            console.log({ pkg, id });
            break npmOptimize;
          }

          if (!npmCache.has(cacheKey)) {
            const maybePending = npmPending.get(cacheKey);
            if (maybePending !== undefined) {
              await maybePending;
            } else {
              const pending = Promise.withResolvers<void>();
              npmPending.set(cacheKey, pending.promise);

              const bundle = await bundleNpmPackage(
                dir,
                platform,
                loader,
                viteConfig.resolve.alias,
              );

              for (const [chunkId, chunk] of bundle.files.entries()) {
                npmCache.set(chunkId, chunk);
              }

              pending.resolve();
            }
          }

          console.log({ cacheKey });
          return {
            id: `\0deno-npm::${cacheKey}`,
          };
        }

        if (original === resolved) {
          return null;
        }

        const type = getDenoType(id, options.attributes.type ?? "default");
        if (
          type !== RequestedModuleType.Default ||
          /^(https?|jsr|npm):/.test(resolved)
        ) {
          return toDenoSpecifier(resolved, type);
        }

        if (resolved.startsWith("file://")) {
          resolved = path.fromFileUrl(resolved);
        }

        return {
          id: resolved,
        };
      } catch {
        // ignore
      }
    },
    async load(id, options) {
      const original = id;

      if (id.startsWith("\0deno-npm::")) {
        const platform = options?.ssr ? "ssr" : "browser";
        id = id.slice("\0deno-npm::".length);

        if (!id.startsWith(platform)) {
          throw new Error(`WWW ${id}`);
        }

        let chunk = npmCache.get(id);
        if (chunk === undefined) {
          chunk = npmCache.get(`${id}.js`);
          if (chunk === undefined) {
            throw new Error(
              `Missing chunk: ${id}, known keys:\n${
                Array.from(npmCache.keys()).map((x) => `- ${x}`).join("\n")
              }\nThis is a bug in Fresh.`,
            );
          }
        }

        return {
          code: chunk.content,
          map: chunk.map,
        };
      }

      const loader = options?.ssr ? ssrLoader : browserLoader;

      let type = RequestedModuleType.Default;
      let specifier: string;

      if (isDenoSpecifier(id)) {
        const result = parseDenoSpecifier(id);
        type = result.type;
        specifier = result.specifier;
      } else {
        if (id.startsWith("\0")) {
          return;
        }

        try {
          specifier = id.startsWith("file://") ? id : path.toFileUrl(id).href;

          // Skip for non-js files like `.css`
          if (!JS_REG.test(id)) {
            return;
          }
        } catch (err) {
          console.log({ original, id });
          throw err;
        }
      }

      const result = await loader.load(specifier, type);
      if (result.kind === "external") {
        return null;
      }

      const code = new TextDecoder().decode(result.code);

      const maybeJsx = babelTransform({
        ssr: !!options?.ssr,
        media: result.mediaType,
        id,
        code,
        isDev,
      });
      if (maybeJsx) {
        return maybeJsx;
      }

      return {
        code,
      };
    },
    transform: {
      filter: {
        id: JSX_REG,
      },
      async handler(_, id, options) {
        // This transform is a hack to be able to re-use Deno's precompile
        // jsx transform.
        if (!options?.ssr) {
          return;
        }

        let actualId = id;
        if (isDenoSpecifier(id)) {
          const { specifier } = parseDenoSpecifier(id);
          actualId = specifier;
        }
        actualId = actualId.replace("?commonjs-es-import", "");

        if (actualId.startsWith("\0")) {
          actualId = actualId.slice(1);
        }
        if (path.isAbsolute(actualId)) {
          actualId = path.toFileUrl(actualId).href;
        }

        const resolved = await ssrLoader.resolve(
          actualId,
          undefined,
          ResolutionMode.Import,
        );
        const result = await ssrLoader.load(
          resolved,
          RequestedModuleType.Default,
        );
        if (result.kind === "external") {
          return;
        }

        const code = new TextDecoder().decode(result.code);

        return {
          code,
        };
      },
    },
  };
}

function isJsMediaType(media: MediaType): boolean {
  switch (media) {
    case MediaType.JavaScript:
    case MediaType.Jsx:
    case MediaType.Mjs:
    case MediaType.Cjs:
    case MediaType.TypeScript:
    case MediaType.Mts:
    case MediaType.Cts:
    case MediaType.Tsx:
      return true;

    case MediaType.Dts:
    case MediaType.Dmts:
    case MediaType.Dcts:
    case MediaType.Css:
    case MediaType.Json:
    case MediaType.Html:
    case MediaType.Sql:
    case MediaType.Wasm:
    case MediaType.SourceMap:
    case MediaType.Unknown:
      return false;
  }
}

export type DenoSpecifier = string & { __deno: string };

function isDenoSpecifier(str: unknown): str is DenoSpecifier {
  return typeof str === "string" && str.startsWith("\0deno::");
}

function toDenoSpecifier(spec: string, type: RequestedModuleType) {
  return `\0deno::${type}::${spec}`;
}

function parseDenoSpecifier(
  spec: DenoSpecifier,
): { type: RequestedModuleType; specifier: string } {
  const match = spec.match(/^\0deno::([^:]+)::(.*)$/)!;

  let specifier = match[2];

  const specMatch = specifier.match(/^(\w+):\/([^/].*)$/);
  if (specMatch !== null) {
    const protocol = specMatch[1];

    let rest = specMatch[2];
    if (protocol === "file") {
      rest = "/" + rest;
    }

    specifier = `${protocol}://${rest}`;
  }

  if (path.isAbsolute(specifier)) {
    specifier = path.toFileUrl(specifier).href;
  }

  return { type: +match[1], specifier };
}

function getDenoType(id: string, type: string): RequestedModuleType {
  switch (type) {
    case "json":
      return RequestedModuleType.Json;
    case "bytes":
      return RequestedModuleType.Bytes;
    case "text":
      return RequestedModuleType.Text;
    default:
      if (id.endsWith(".json")) {
        return RequestedModuleType.Json;
      }
      return RequestedModuleType.Default;
  }
}

function babelTransform(
  options: {
    media: MediaType;
    ssr: boolean;
    code: string;
    id: string;
    isDev: boolean;
  },
) {
  if (!isJsMediaType(options.media)) {
    return null;
  }

  const { ssr, code, id, isDev } = options;

  const presets: babel.PluginItem[] = [];
  if (
    !ssr && id.endsWith(".tsx") || id.endsWith(".jsx")
  ) {
    presets.push([babelReact, {
      runtime: "automatic",
      importSource: "preact",
      development: isDev,
      throwIfNamespace: false,
    }]);
  }

  const url = URL.canParse(id) ? new URL(id) : null;

  const result = babel.transformSync(code, {
    filename: id,
    babelrc: false,
    sourceMaps: "inline",
    presets: presets,
    plugins: [httpAbsolute(url)],
    compact: true,
  });

  if (result !== null && result.code) {
    return {
      code: result.code,
      map: result.map,
    };
  }

  return null;
}
