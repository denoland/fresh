import twPostcss from "@tailwindcss/postcss";
import postcss from "postcss";
import type { ResolvedFreshConfig } from "fresh";
import type { TailwindPluginOptions } from "./types.ts";

export function initTailwind(
  config: ResolvedFreshConfig,
  options: TailwindPluginOptions = {},
): postcss.Processor {
  const plugins = [
    twPostcss({
      optimize: config.mode === "production",
      ...options,
    }),
  ];

  return postcss(plugins);
}
