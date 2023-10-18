import type { Plugin } from "../server.ts";
import { type Config, tailwindcss as tailwind } from "./tailwind_deps.ts";
import postcssPlugin, { type PostCssPluginOptions } from "./postcss.ts";

/**
 * Fresh PostCSS Tailwind Plugin
 * @param options - {@link PostCssPluginOptions} PostCSS plugin options
 * @param config - Tailwind configuration
 * @returns PostCSS plugin to process Tailwind in Fresh
 * @example
 * ```ts
 * import { defineConfig } from "$fresh/server.ts";
 * import tailwindPlugin from "$fresh/plugins/tailwind.ts";
 *
 * export default defineConfig({
 *   plugins: [
 *     tailwindPlugin({
 *       css: ["./src/styles.css"],
 *     }, (await import("./tailwind.config.ts")).default),
 *   ],
 * });
 * ```
 */
export default function tailwindPlugin(
  options: PostCssPluginOptions | PostCssPluginOptions["css"],
  config: Config,
): Plugin {
  const opts = (typeof options === "string" || Array.isArray(options) ||
      !("css" in options))
    ? { css: options }
    : options as PostCssPluginOptions;

  return postcssPlugin({
    ...opts,
    setup: (raw) => {
      if (!config.content) {
        config.content = [];
      }

      // Push rendered content into Tailwind content config
      if (Array.isArray(config.content) && raw?.length) {
        config.content.push({ raw, extension: ".html" });
      }

      return [
        ...opts.setup?.(raw) ?? [],
        // @ts-ignore Tailwind isn't typed here
        tailwind(config),
      ];
    },
  });
}
