import type { Plugin } from "vite";
import {
  type Loader,
  RequestedModuleType,
  ResolutionMode,
  Workspace,
} from "@deno/loader";
import * as path from "@std/path";
import * as babel from "@babel/core";
import { npmWorkaround } from "./patches/npm_workaround.ts";
import babelReact from "@babel/preset-react";

interface DenoState {
  type: RequestedModuleType;
}

export function deno(): Plugin {
  let ssrLoader: Loader;
  let browserLoader: Loader;

  let isDev = false;

  return {
    name: "deno",
    config(_, env) {
      isDev = env.command === "serve";
    },
    async configResolved() {
      // TODO: Pass conditions
      ssrLoader = await new Workspace({}).createLoader();
      browserLoader = await new Workspace({
        platform: "browser",
        preserveJsx: true,
      })
        .createLoader();
    },
    applyToEnvironment() {
      return true;
    },
    async resolveId(id, importer, options) {
      const loader = options?.ssr ? ssrLoader : browserLoader;

      // Workaround until upstream PR is merged and released,
      // see: https://github.com/vitejs/vite/pull/20558
      if (id.startsWith("deno-npm:")) {
        id = id.slice("deno-".length);
      }

      importer = isDenoSpecifier(importer)
        ? parseDenoSpecifier(importer).specifier
        : importer;

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

        if (id === resolved) {
          return id;
        }

        const type = getDenoType(id, options.attributes.type ?? "default");
        if (
          type !== RequestedModuleType.Default ||
          /^(https?|jsr|npm):/.test(resolved) ||
          // Vite does weird things to windows file paths
          Deno.build.os === "windows"
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

        return {
          code: new TextDecoder().decode(result.code),
        };
      }

      if (id.startsWith("\0")) {
        id = id.slice(1);
      }

      const meta = this.getModuleInfo(id)?.meta.deno as
        | DenoState
        | undefined
        | null;

      if (meta === null || meta === undefined) return;

      const url = path.toFileUrl(id);

      const result = await loader.load(url.href, meta.type);
      if (result.kind === "external") {
        return null;
      }

      const code = new TextDecoder().decode(result.code);

      if (!options?.ssr) {
        if (url.pathname.endsWith(".jsx") || url.pathname.endsWith(".tsx")) {
          const result = babel.transform(code, {
            sourceMaps: "inline",
            filename: id,
            presets: [
              [
                babelReact,
                {
                  runtime: "automatic",
                  importSource: "preact",
                  development: isDev,
                },
              ],
            ],
          });

          if (result !== null && result.code) {
            return {
              code: result.code,
              map: result.map,
            };
          }
        }
      }

      return {
        code,
      };
    },
    async transform(_, id, options) {
      // This transform is a hack to be able to re-use Deno's precompile
      // jsx transform.
      if (!options?.ssr || !id.endsWith(".tsx") || id.endsWith(".jsx")) {
        return;
      }

      let actualId = id;
      if (isDenoSpecifier(id)) {
        const { specifier } = parseDenoSpecifier(id);
        actualId = specifier;
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

      // Ensure vite never sees `npm:` specifiers. The load call here
      // can potentially insert JSX pragmas which refer to `npm:`
      // specifiers.
      const res = babel.transformSync(code, {
        filename: id,
        babelrc: false,
        plugins: [npmWorkaround],
      });
      if (res?.code) {
        return {
          code: res.code,
          map: res.map,
        };
      }

      return {
        code,
      };
    },
  };
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
