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
 * Vite plugin that handles:
 * 1. Resolving bare specifiers from Fresh's virtual modules through Deno's loader
 * 2. SSR precompile JSX re-transform
 */
export function freshSsrTransform(
  getLoader: () => Promise<Loader>,
): Plugin {
  let ssrLoader: Loader | null = null;

  async function loader(): Promise<Loader> {
    if (!ssrLoader) {
      ssrLoader = await getLoader();
    }
    return ssrLoader;
  }

  return {
    name: "fresh:ssr-transform",
    enforce: "pre",
    sharedDuringBuild: true,
    applyToEnvironment() {
      return true;
    },
    // Resolve bare specifiers that @deno/vite-plugin might miss
    // (e.g. imports from Fresh's virtual modules like fresh:server-snapshot)
    async resolveId(id, _importer, options) {
      // Skip if already handled or starts with known prefixes
      if (
        isDenoSpecifier(id) ||
        id.startsWith(".") ||
        id.startsWith("/") ||
        id.startsWith("\0") ||
        id.startsWith("node:") ||
        id.startsWith("npm:") ||
        id.startsWith("jsr:")
      ) {
        return;
      }

      // Try to resolve through the Deno loader's import map
      try {
        const l = await loader();
        const resolved = l.resolveSync(
          id,
          undefined,
          ResolutionMode.Import,
        );
        if (resolved && resolved !== id) {
          // Re-resolve the result through the plugin pipeline
          // so @deno/vite-plugin can create the proper deno:: specifier
          const result = await this.resolve(resolved, undefined, {
            ...options,
            skipSelf: true,
          });
          return result;
        }
      } catch {
        // Not resolvable by Deno — let Vite handle it
      }
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
          const l = await loader();
          const resolved = await l.resolve(
            actualId,
            undefined,
            ResolutionMode.Import,
          );
          const result = await l.load(
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
