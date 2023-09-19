import { DEV_MODE } from "./constants.ts";
import { dirname, fromFileUrl, isAbsolute, join, JSONC } from "./deps.ts";
import { FromManifestOptions, Manifest } from "./mod.ts";
import { DenoConfig, InternalFreshOptions } from "./types.ts";

export async function readDenoConfig(
  directory: string,
): Promise<{ config: DenoConfig; path: string }> {
  let dir = directory;
  while (true) {
    for (const name of ["deno.json", "deno.jsonc"]) {
      const path = join(dir, name);
      try {
        const file = await Deno.readTextFile(path);
        if (name.endsWith(".jsonc")) {
          return { config: JSONC.parse(file) as DenoConfig, path };
        } else {
          return { config: JSON.parse(file), path };
        }
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
      }
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Could not find a deno.json file in the current directory or any parent directory.`,
      );
    }
    dir = parent;
  }
}

function isObject(value: unknown) {
  return value !== null && typeof value === "object" &&
    !Array.isArray(value);
}

export async function getFreshConfigWithDefaults(
  manifest: Manifest,
  opts: FromManifestOptions,
): Promise<InternalFreshOptions> {
  const base = dirname(fromFileUrl(manifest.baseUrl));
  const { config: denoJson, path: denoJsonPath } = await readDenoConfig(base);

  if (typeof denoJson.importMap !== "string" && !isObject(denoJson.imports)) {
    throw new Error(
      "deno.json must contain an 'importMap' or 'imports' property.",
    );
  }

  const config: InternalFreshOptions = {
    loadSnapshot: typeof opts.skipSnapshot === "boolean"
      ? !opts.skipSnapshot
      : false,
    dev: opts.dev ?? DEV_MODE,
    denoJsonPath,
    denoJson,
    manifest,
    build: {
      outDir: "",
    },
    plugins: opts.plugins ?? [],
    staticDir: "",
    render: opts.render,
    router: opts.router,
  };

  config.build.outDir = opts.build?.outDir
    ? parseFileOrUrl(opts.build.outDir, base)
    : join(base, "_fresh");

  config.staticDir = opts.staticDir
    ? parseFileOrUrl(opts.staticDir, base)
    : join(base, "static");

  return config;
}

function parseFileOrUrl(input: string, base: string) {
  if (URL.canParse(input)) {
    return fromFileUrl(input);
  } else if (!isAbsolute(input)) {
    return join(base, input);
  }

  return input;
}
