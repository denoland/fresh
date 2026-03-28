/**
 * Fresh-specific transforms for Deno-resolved modules.
 *
 * This module provides the `onLoad` callback for `@deno/vite-plugin` to add:
 * - Babel JSX transform (Preact) for client-side code from remote modules
 *
 * It also provides a separate Vite plugin for SSR precompile JSX re-transform.
 */
import type { Plugin } from "vite";
import * as babel from "@babel/core";
// TODO: Replace with "@deno/vite-plugin" and "@deno/vite-plugin/resolver"
// once published with these exports
import type {
  LoadContext,
  OnLoadResult,
} from "../../../../../deno-vite-plugin/dist/index.d.ts";
import {
  isDenoSpecifier,
  parseDenoSpecifier,
  // @ts-ignore .js -> .d.ts resolution
} from "../../../../../deno-vite-plugin/dist/resolver.js";
import { httpAbsolute } from "./patches/http_absolute.ts";
import { JSX_REG } from "../utils.ts";
import {
  type Loader,
  MediaType,
  RequestedModuleType,
  ResolutionMode,
  Workspace,
} from "@deno/loader";

// @ts-ignore Workaround for https://github.com/denoland/deno/issues/30850
const { default: babelReact } = await import("@babel/preset-react");

/**
 * Creates the `onLoad` callback for `@deno/vite-plugin`.
 * Applies Preact JSX transforms to client-side code from Deno specifiers.
 */
export function createFreshOnLoad(isDev: boolean) {
  return (ctx: LoadContext): OnLoadResult => {
    if (ctx.ssr) return; // SSR handled by freshSsrTransform plugin

    return babelTransform({
      ssr: false,
      code: ctx.code,
      id: ctx.id,
      mediaType: ctx.mediaType as MediaType,
      isDev,
    });
  };
}

/**
 * Vite plugin that handles SSR precompile JSX re-transform.
 * This runs as a `transform` hook on JSX files in the server environment,
 * re-loading them through Deno's loader to get the precompiled JSX output.
 */
export function freshSsrTransform(): Plugin {
  let ssrLoader: Loader;

  return {
    name: "fresh:ssr-transform",
    sharedDuringBuild: true,
    applyToEnvironment() {
      return true;
    },
    async configResolved() {
      ssrLoader = await new Workspace({
        platform: "node",
        cachedOnly: true,
      }).createLoader();
    },
    transform: {
      filter: {
        id: JSX_REG,
      },
      async handler(_, id) {
        // Only apply to server environment
        if (this.environment.name === "client") {
          return;
        }

        let actualId = id;
        if (isDenoSpecifier(id)) {
          const { resolved } = parseDenoSpecifier(id);
          actualId = resolved;
        }
        actualId = actualId.replace("?commonjs-es-import", "");

        if (actualId.startsWith("\0")) {
          actualId = actualId.slice(1);
        }

        // Convert absolute paths to file URLs
        if (/^[/a-zA-Z]/.test(actualId) && !actualId.includes("://")) {
          const { toFileUrl } = await import("@std/path");
          actualId = toFileUrl(actualId).href;
        }

        try {
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
          return { code };
        } catch {
          return;
        }
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
    default:
      return false;
  }
}

function babelTransform(
  options: {
    ssr: boolean;
    code: string;
    id: string;
    mediaType: MediaType;
    isDev: boolean;
  },
) {
  if (!isJsMediaType(options.mediaType)) {
    return null;
  }

  const { ssr, code, id, isDev } = options;

  const presets: babel.PluginItem[] = [];
  if (
    !ssr && (id.endsWith(".tsx") || id.endsWith(".jsx"))
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
    sourceMaps: "both",
    presets: presets,
    plugins: [httpAbsolute(url)],
    compact: false,
  });

  if (result !== null && result.code) {
    return {
      code: result.code,
      map: result.map ? JSON.stringify(result.map) : null,
    };
  }

  return null;
}
