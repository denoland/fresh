import twPostcss from "@tailwindcss/postcss";
import postcss from "postcss";
import type { TailwindPluginOptions } from "./types.ts";
import type { ResolvedFreshConfig } from "fresh";

export async function initTailwind(
  config: ResolvedFreshConfig,
  options: TailwindPluginOptions = {},
): Promise<postcss.Processor> {
  const minify = config.mode === "production" && options.minify !== false;

  const plugins = [
    twPostcss({
      ...options.postcssOptions,
      optimize: minify ? { minify: true } : true,
    }),
  ];

  return postcss(plugins);
}
