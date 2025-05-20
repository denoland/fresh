import twPostcss from "@tailwindcss/postcss";
import postcss from "postcss";
import type { ResolvedFreshConfig } from "fresh";

export function initTailwind(
  config: ResolvedFreshConfig,
): postcss.Processor {
  const plugins = [
    twPostcss({
      optimize: config.mode === "production",
    }),
  ];

  return postcss(plugins);
}
