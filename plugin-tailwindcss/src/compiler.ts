import tailwindPoscss from "@tailwindcss/postcss";
import postcss from "postcss";
import type { ResolvedFreshConfig } from "fresh";
import type { Processor } from "postcss";

export function initTailwind(
  config: ResolvedFreshConfig,
): Processor {
  const res = postcss(tailwindPoscss({
    optimize: config.mode === "production",
  }));

  return res;
}
