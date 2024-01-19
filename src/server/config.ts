import { dirname, fromFileUrl, isAbsolute, join, JSONC } from "./deps.ts";
import { FromManifestConfig, Manifest } from "./mod.ts";
import { DEFAULT_RENDER_FN } from "./render.ts";
import {
  DenoConfig,
  InternalFreshState,
  ResolvedFreshConfig,
} from "./types.ts";

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

export async function getInternalFreshState(
  manifest: Manifest,
  config: FromManifestConfig,
): Promise<InternalFreshState> {
  const base = dirname(fromFileUrl(manifest.baseUrl));
  const { config: denoJson, path: denoJsonPath } = await readDenoConfig(base);

  if (typeof denoJson.importMap !== "string" && !isObject(denoJson.imports)) {
    throw new Error(
      "deno.json must contain an 'importMap' or 'imports' property.",
    );
  }

  const isLegacyDev = Deno.env.get("__FRSH_LEGACY_DEV") === "true";

  /**
   * assume a basePath is declared like this:
   * basePath: "/foo/bar"
   * it must start with a slash, and not have a trailing slash
   */

  let basePath = "";
  if (config.router?.basePath) {
    basePath = config.router?.basePath;
    if (!basePath.startsWith("/")) {
      throw new TypeError(
        `"basePath" option must start with "/". Received: "${basePath}"`,
      );
    }
    if (basePath.endsWith("/")) {
      throw new TypeError(
        `"basePath" option must not end with "/". Received: "${basePath}"`,
      );
    }
  }

  const internalConfig: ResolvedFreshConfig = {
    dev: isLegacyDev || Boolean(config.dev),
    build: {
      outDir: config.build?.outDir
        ? parseFileOrUrl(config.build.outDir, base)
        : join(base, "_fresh"),
      target: config.build?.target ?? ["chrome99", "firefox99", "safari15"],
    },
    plugins: config.plugins ?? [],
    staticDir: config.staticDir
      ? parseFileOrUrl(config.staticDir, base)
      : join(base, "static"),
    render: config.render ?? DEFAULT_RENDER_FN,
    router: config.router,
    server: config.server ?? {},
    basePath,
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

  return {
    config: internalConfig,
    manifest,
    loadSnapshot: !isLegacyDev && !config.dev,
    didLoadSnapshot: false,
    denoJsonPath,
    denoJson,
    build: false,
  };
}

function parseFileOrUrl(input: string, base: string) {
  if (input.startsWith("file://")) {
    return fromFileUrl(input);
  } else if (!isAbsolute(input)) {
    return join(base, input);
  }

  return input;
}
