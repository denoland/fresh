import type { Plugin } from "vite";
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

// @ts-ignore Workaround for https://github.com/denoland/deno/issues/30850
const { default: babelReact } = await import("@babel/preset-react");

const BUILTINS = new Set(builtinModules);

interface DenoState {
  type: RequestedModuleType;
}

export type PkgExport =
  | string
  | Record<
    string,
    | string
    | Record<string, string | Record<string, string | Record<string, string>>>
  >;

interface PkgJson {
  name: string;
  version: string;
  main?: string;
  module?: string;
  exports?: PkgExport;
}

export function deno(): Plugin {
  let ssrLoader: Loader;
  let browserLoader: Loader;
  let root = "";

  let isDev = false;

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
      root = config.root;

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
      if (id.startsWith("/@fs/")) return;

      if (!id.startsWith(".")) {
        console.log("resolve", { id, importer, ssr: options.ssr });
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

      // Resolve to vite optimized dep
      const match = id.match(/npm:(@[^/]+\/[^@/]+|[^@/]+)(@[^/]+)(.*)/);
      if (match !== null) {
        const pkg = match[1];
        const entry = match[3];

        let file = pkg.replaceAll("/", "_");

        if (entry !== "") {
          file += `_${entry.replaceAll("/", "_")}`;
        }

        const optimizedPath = path.join(
          root,
          ".vite",
          `deps${options.ssr ? "_ssr" : ""}`,
          file,
        );

        console.log({ optimizedPath });
        return optimizedPath;
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

        // Let vite handle npm modules by doing a reverse lookup
        // with the resolved package.
        const match = resolved.match(
          /(.*\/node_modules\/\.deno\/(@[^/]+\/+[^/]+|[^@][^/]+)\/(@[^/]+\/+[^/]+|[^@][^/]+))\/(.*)/,
        );
        console.log("maybe reverse", original, resolved);
        if (match !== null) {
          console.log("REVERSE", original);
          try {
            const pkgDir = path.fromFileUrl(match[1]);
            const pkgJsonPath = path.join(pkgDir, "package.json");
            const pkgJson = JSON.parse(
              await Deno.readTextFile(pkgJsonPath),
            ) as PkgJson;

            const name = match[3];

            const entry = match[4].replace(/\\+/, "/");

            if (pkgJson.exports !== undefined) {
              const matched = matchPkgExport(name, entry, pkgJson.exports);
              if (matched !== undefined) {
                if (importer?.includes("node_modules")) {
                  console.log("match exports", {
                    name,
                    entry,
                    importer,
                    exports: pkgJson.exports,
                  });
                }
                return matched;
              }
            }
          } catch {
            // ignore
          }
        }

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
          meta: {
            deno: {
              type,
            },
          },
        };
      } catch {
        // ignore
      }
    },
    async load(id, options) {
      const loader = options?.ssr ? ssrLoader : browserLoader;

      if (isDenoSpecifier(id)) {
        const { type, specifier } = parseDenoSpecifier(id);

        const result = await loader.load(specifier, type);
        if (result.kind === "external") {
          return null;
        }

        const code = new TextDecoder().decode(result.code);

        const maybeJsx = babelTransform({
          ssr: !!options?.ssr,
          media: result.mediaType,
          code,
          id: specifier,
          isDev,
        });
        if (maybeJsx !== null) {
          return maybeJsx;
        }

        return {
          code,
        };
      }

      if (id.startsWith("\0")) {
        id = id.slice(1);
      }

      id = removeSearch(id);

      let meta = this.getModuleInfo(id)?.meta.deno as
        | DenoState
        | undefined
        | null;

      maybe:
      if (meta === null || meta === undefined) {
        // Maybe it's a mapped Deno path
        try {
          const resolved = await loader.resolve(
            id,
            undefined,
            ResolutionMode.Import,
          );
          if (resolved !== id) {
            id = resolved;
            meta = { type: RequestedModuleType.Default };
            break maybe;
          }
        } catch {
          // Ignore
        }
        return;
      }

      // Skip for non-js files like `.css`
      if (
        meta.type === RequestedModuleType.Default &&
        !JS_REG.test(id)
      ) {
        return;
      }

      const url = !/^[a-z]+:\/\//.test(id) ? path.toFileUrl(id).href : id;

      const result = await loader.load(url, meta.type);
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

function removeSearch(id: string): string {
  const idx = id.indexOf("?");
  if (idx > -1) {
    return id.slice(0, idx);
  }

  return id;
}

export function matchPkgExport(
  name: string,
  entry: string,
  exportValue: PkgExport,
): string | undefined {
  const mappedEntry = `./${entry}`;

  for (const [key, value] of Object.entries(exportValue)) {
    const result = matchExportEntry(name, key, mappedEntry, value);
    if (result !== undefined) return result;
  }
}

function matchExportEntry(
  name: string,
  key: string,
  entry: string,
  value: PkgExport | null,
): string | undefined {
  if (value === null) return;

  if (value === entry) {
    if (key === ".") {
      return name;
    }
    return `${name}${key.slice(1)}`;
  }

  if (typeof value === "object") {
    for (const subValue of Object.values(value)) {
      const result = matchExportEntry(name, key, entry, subValue);
      if (result !== undefined) return result;
    }
  }
}
