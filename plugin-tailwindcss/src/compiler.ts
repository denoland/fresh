import twPostcss from "@tailwindcss/postcss";
import postcss from "postcss";
import type { TailwindPluginOptions } from "./types.ts";
import type { ResolvedFreshConfig } from "fresh";

export async function initTailwind(
  config: ResolvedFreshConfig,
  options: TailwindPluginOptions = {},
): Promise<postcss.Processor> {
  const plugins = [
    // deno-lint-ignore no-explicit-any
    twPostcss(options.postcssOptions) as any,
  ];

  // when in production mode, minify the CSS
  if (config.mode === "production" && options.minify !== false) {
    const { default: cssnano } = await import("cssnano");
    // deno-lint-ignore no-explicit-any
    plugins.push(cssnano(options.cssnanoOptions ?? {}) as any);
  }

  return postcss(plugins);
}
