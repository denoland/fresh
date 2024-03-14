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
  build?: {
    outDir?: string;
  };
  basePath?: string;
  staticDir?: string;
  dir: string;
  load: (path: string) => Promise<unknown>;
}

export interface ResolvedFreshConfig {
  build: {
    outDir: string;
  };
  basePath: string;
  staticDir: string;
  mode: Mode;
  dir: string;
  load: (path: string) => Promise<unknown>;
}

export function normalizeConfig(options: FreshConfig): ResolvedFreshConfig {
  return {
    build: {
      outDir: options.build?.outDir ?? path.join(options.dir, "_fresh"),
    },
    basePath: options.basePath ?? "",
    staticDir: options.staticDir ?? path.join(options.dir, "static"),
    mode: MODE,
    dir: options.dir,
    load: options.load,
  };
}
