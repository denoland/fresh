import * as path from "@std/path";
import * as JSONC from "@std/jsonc";

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

export function normalizeConfig(
  options: FreshConfig,
): ResolvedFreshConfig {
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

export interface DenoConfig {
  imports?: Record<string, string>;
  importMap?: string;
  tasks?: Record<string, string>;
  lint?: {
    rules: { tags?: string[] };
    exclude?: string[];
  };
  fmt?: {
    exclude?: string[];
  };
  exclude?: string[];
  compilerOptions?: {
    jsx?: string;
    jsxImportSource?: string;
  };
}

export async function readDenoConfig(
  directory: string,
): Promise<{ config: DenoConfig; filePath: string }> {
  let dir = directory;
  while (true) {
    for (const name of ["deno.json", "deno.jsonc"]) {
      const filePath = path.join(dir, name);
      try {
        const file = await Deno.readTextFile(filePath);
        if (name.endsWith(".jsonc")) {
          return { config: JSONC.parse(file) as DenoConfig, filePath };
        } else {
          return { config: JSON.parse(file), filePath };
        }
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Could not find a deno.json file in the current directory or any parent directory.`,
      );
    }
    dir = parent;
  }
}
