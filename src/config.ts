import * as path from "@std/path";

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
    /**
     * The directory to write generated files to when `dev.ts build` is run.
     * This can be an absolute path, a file URL or a relative path.
     */
    outDir?: string;
    /**
     * This sets the target environment for the generated code. Newer
     * language constructs will be transformed to match the specified
     * support range. See https://esbuild.github.io/api/#target
     * @default {"es2022"}
     */
    target?: string | string[];
  };
  /**
   * Serve fresh from a base path instead of from the root.
   *   "/foo/bar" -> http://localhost:8000/foo/bar
   * @default {undefined}
   */
  basePath?: string;
  staticDir?: string;
}

export interface ResolvedFreshConfig {
  root: string;
  build: {
    outDir: string;
    target: string | string[];
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
      target: options.build?.target ?? ["chrome99", "firefox99", "safari15"],
    },
    basePath: options.basePath ?? "",
    staticDir: options.staticDir ?? path.join(root, "static"),
    mode: MODE,
  };
}
