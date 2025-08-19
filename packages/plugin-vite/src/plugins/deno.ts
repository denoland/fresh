import type { Plugin } from "vite";
import {
  type Loader,
  RequestedModuleType,
  ResolutionMode,
  Workspace,
} from "@deno/loader";
import * as path from "@std/path";
import * as babel from "@babel/core";
import babelReact from "@babel/preset-react";
import { httpAbsolute } from "./patches/http_absolute.ts";

interface DenoState {
  type: RequestedModuleType;
}

export function deno(): Plugin {
  let ssrLoader: Loader;
  let browserLoader: Loader;

  let isDev = false;

  return {
    name: "deno",
    // We must be first to be able to resolve before the
    // Vite's own`vite:resolve` plugin. It always treats bare
    // specifiers as external during SSR.
    enforce: "pre",
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

      const meta = this.getModuleInfo(id)?.meta.deno as
        | DenoState
        | undefined
        | null;

      if (meta === null || meta === undefined) return;

      // Skip for non-js files like `.css`
      if (
        meta.type === RequestedModuleType.Default &&
        !/\.([tj]sx?|[mc]?[tj]s)$/.test(id)
      ) {
        return;
      }

      const url = path.toFileUrl(id);

      const result = await loader.load(url.href, meta.type);
      if (result.kind === "external") {
        return null;
      }

      const code = new TextDecoder().decode(result.code);

      const maybeJsx = babelTransform({
        ssr: !!options?.ssr,
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
  options: { ssr: boolean; code: string; id: string; isDev: boolean },
) {
  if (
    !/\.([tj]sx?|[mc[jt]s)$/.test(options.id) &&
    !/^https?:\/\//.test(options.id)
  ) {
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
  });

  if (result !== null && result.code) {
    return {
      code: result.code,
      map: result.map,
    };
  }

  return null;
}
