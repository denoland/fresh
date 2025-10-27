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
  bundleNpmPackage,
  type BundleResult,
  readPackageJson,
  reverseLookupNpm,
} from "./npm.ts";

// @ts-ignore Workaround for https://github.com/denoland/deno/issues/30850
const { default: babelReact } = await import("@babel/preset-react");

const BUILTINS = new Set(builtinModules);
const NPM_PKG_NAME = /^(@[^/]+\/[^@/]+|[^@][^/@]+)/;

export function deno(): Plugin {
  let ssrLoader: Loader;
  let browserLoader: Loader;

  let isDev = false;

  const npmCache = new Map<string, BundleResult>();
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
        cachedOnly: true,
      }).createLoader();
      browserLoader = await new Workspace({
        platform: "browser",
        preserveJsx: true,
        cachedOnly: true,
      })
        .createLoader();
    },
    applyToEnvironment() {
      return true;
    },
    async resolveId(id, importer, options) {
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
      const loader = options?.ssr ? ssrLoader : browserLoader;

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
      const tmp = await this.resolve(id, importer, options);
      if (tmp && tmp.resolvedBy !== "vite:resolve") {
        if (tmp.external && !/^https?:\/\//.test(tmp.id)) {
          return tmp;
        }

        // A plugin namespaced it, we should not attempt to resolve it.
        if (tmp.id.startsWith("\0")) {
          return tmp;
        }

        id = tmp.id;
      }

      // Plugins may return lower cased drive letters on windows
      if (!isHttp && path.isAbsolute(id)) {
        id = path.toFileUrl(path.normalize(id))
          .href;
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

        if (resolved.startsWith("node:")) {
          return {
            id: resolved,
            external: true,
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

        const url = path.toFileUrl(id);
        specifier = url.href;

        // Skip for non-js files like `.css`
        if (!JS_REG.test(id)) {
          return;
        }
      }

      // Load npm bundle if it's an npm specifier.
      const nodeIdx = specifier.lastIndexOf("/node_modules/");
      npmOptimize: if (nodeIdx > -1) {
        const endIdx = nodeIdx + "/node_modules/".length;
        const part = specifier.slice(endIdx);
        const match = part.match(NPM_PKG_NAME);
        if (match === null) {
          throw new Error(
            `Unable to detect npm package from path: ${specifier}`,
          );
        }

        const pkg = match[1];
        const fileDir = specifier.slice(0, endIdx + pkg.length);
        const dir = path.fromFileUrl(fileDir);
        const pkgJson = await readPackageJson(
          path.join(dir, "package.json"),
        );

        const cacheKey = reverseLookupNpm(pkgJson, dir, specifier);
        if (cacheKey === undefined) break npmOptimize;

        if (pkg === "vite") {
          console.log({ pkg, id, specifier });
          break npmOptimize;
        }

        let cached = npmCache.get(cacheKey);
        if (cached === undefined) {
          const maybePending = npmPending.get(cacheKey);
          if (maybePending !== undefined) {
            await maybePending;

            cached = npmCache.get(cacheKey)!;
          } else {
            const pending = Promise.withResolvers<void>();
            npmPending.set(cacheKey, pending.promise);

            const bundle = await bundleNpmPackage(
              dir,
              options?.ssr ? "ssr" : "browser",
              loader,
              viteConfig.resolve.alias,
            );
            npmCache.set(cacheKey, bundle);
            cached = bundle;

            pending.resolve();
          }
        }

        const fileKey = !specifier.startsWith("file://")
          ? path.toFileUrl(specifier).href
          : specifier;

        const chunk = cached.files.get(fileKey);
        if (chunk !== undefined) {
          return {
            code: chunk.content,
            map: chunk.map,
          };
        } else {
          console.log(
            "NO CHUNK",
            fileKey,
            cacheKey,
            Array.from(cached.files.keys()),
          );
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
