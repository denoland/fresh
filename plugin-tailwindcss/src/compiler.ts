import tailwindPoscss from "@tailwindcss/postcss";
import postcss from "postcss";
import type { ResolvedFreshConfig } from "fresh";
import type { Plugin, Processor } from "postcss";

export function initTailwind(
  config: ResolvedFreshConfig,
): Processor {
  return postcss([
    tailwindPoscss({
      optimize: config.mode === "production",
    }),
  ] as Plugin[]);
}
