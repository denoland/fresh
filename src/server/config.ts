import { dirname, fromFileUrl, isAbsolute, join, JSONC } from "./deps.ts";
import { FromManifestConfig, Manifest } from "./mod.ts";
import { DenoConfig, InternalFreshConfig } from "./types.ts";

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
  config: FromManifestConfig,
): Promise<InternalFreshConfig> {
  const base = dirname(fromFileUrl(manifest.baseUrl));
  const { config: denoJson, path: denoJsonPath } = await readDenoConfig(base);

  if (typeof denoJson.importMap !== "string" && !isObject(denoJson.imports)) {
    throw new Error(
      "deno.json must contain an 'importMap' or 'imports' property.",
    );
  }

  const internalConfig: InternalFreshConfig = {
    loadSnapshot: typeof config.skipSnapshot === "boolean"
      ? !config.skipSnapshot
      : false,
    dev: config.dev ?? false,
    denoJsonPath,
    denoJson,
    manifest,
    build: {
      outDir: "",
      target: config.build?.target ?? ["chrome99", "firefox99", "safari15"],
    },
    plugins: config.plugins ?? [],
    staticDir: "",
    render: config.render,
    router: config.router,
    server: config.server ?? {},
  };

  if (config.cert) {
    internalConfig.server.cert = config.cert;
  }
  if (config.hostname) {
    internalConfig.server.hostname = config.hostname;
  }
  if (config.key) {
    internalConfig.server.key = config.key;
  }
  if (config.onError) {
    internalConfig.server.onError = config.onError;
  }
  if (config.onListen) {
    internalConfig.server.onListen = config.onListen;
  }
  if (config.port) {
    internalConfig.server.port = config.port;
  }
  if (config.reusePort) {
    internalConfig.server.reusePort = config.reusePort;
  }
  if (config.signal) {
    internalConfig.server.signal = config.signal;
  }

  internalConfig.build.outDir = config.build?.outDir
    ? parseFileOrUrl(config.build.outDir, base)
    : join(base, "_fresh");

  internalConfig.staticDir = config.staticDir
    ? parseFileOrUrl(config.staticDir, base)
    : join(base, "static");

  return internalConfig;
}

function parseFileOrUrl(input: string, base: string) {
  if (input.startsWith("file://")) {
    return fromFileUrl(input);
  } else if (!isAbsolute(input)) {
    return join(base, input);
  }

  return input;
}
