import * as path from "jsr:@std/path";

export type Mode = "dev" | "build" | "prod";

export let MODE: Mode = "prod";

export function setMode(mode: Mode) {
  MODE = mode;
}

export interface FreshPlugin {
  name: string;
}

export interface FreshConfig {
  root?: string;
  build?: {
    outDir?: string;
  };
  basePath?: string;
  staticDir?: string;
}

export interface ResolvedFreshConfig {
  root: string;
  build: {
    outDir: string;
  };
  basePath: string;
  staticDir: string;
  mode: Mode;
}

export function normalizeConfig(options: FreshConfig): ResolvedFreshConfig {
  const root = options.root ?? Deno.cwd();
  return {
    root,
    build: {
      outDir: options.build?.outDir ?? path.join(root, "_fresh"),
    },
    basePath: options.basePath ?? "",
    staticDir: options.staticDir ?? path.join(root, "static"),
    mode: MODE,
  };
}
