import {
  InternalFreshConfig,
  Island,
  Plugin,
} from "$fresh/src/server/types.ts";
import { ComposeHandler } from "$fresh/src/server/compose.ts";
import {
  AotSnapshot,
  BuildSnapshot,
  BuildSnapshotJson,
  EsbuildBuilder,
} from "$fresh/src/build/mod.ts";
import {
  colors,
  extname,
  join,
  typeByExtension,
} from "$fresh/src/server/deps.ts";
import { BUILD_ID, setBuildId } from "$fresh/src/server/build_id.ts";

export async function createAssetMiddleware(
  config: InternalFreshConfig,
  islands: Island[],
): Promise<ComposeHandler> {
  let snapshot: BuildSnapshot | null = null;
  let buildPromise: Promise<BuildSnapshot>;
  if (config.loadSnapshot) {
    const snapshotDirPath = config.build.outDir;
    try {
      if ((await Deno.stat(snapshotDirPath)).isDirectory) {
        console.log(
          `Using snapshot found at ${colors.cyan(snapshotDirPath)}`,
        );

        const snapshotPath = join(snapshotDirPath, "snapshot.json");
        const json = JSON.parse(
          await Deno.readTextFile(snapshotPath),
        ) as BuildSnapshotJson;
        setBuildId(json.build_id);

        const dependencies = new Map<string, string[]>(
          Object.entries(json.files),
        );

        const files = new Map<string, string>();
        Object.keys(json.files).forEach((name) => {
          const filePath = join(snapshotDirPath, name);
          files.set(name, filePath);
        });

        snapshot = new AotSnapshot(files, dependencies);
        buildPromise = Promise.resolve<BuildSnapshot>(snapshot);
      }
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) {
        throw err;
      }
    }
  } else {
    const builder = new EsbuildBuilder({
      buildID: BUILD_ID,
      entrypoints: collectEntrypoints(
        config.dev,
        islands,
        config.plugins,
      ),
      configPath: config.denoJsonPath,
      dev: config.dev,
      jsxConfig: config.jsx,
      target: config.build.target,
    });
    buildPromise = builder.build().then((esbuildSnapshot) => {
      return snapshot = esbuildSnapshot;
    });
  }

  return async (_req, ctx) => {
    const { params } = ctx;

    if (snapshot === null) {
      snapshot = await buildPromise;
    }

    const contents = await snapshot.read(params.path);
    if (!contents) return new Response(null, { status: 404 });

    const headers: Record<string, string> = {
      "Cache-Control": "public, max-age=604800, immutable",
    };

    const contentType = typeByExtension(extname(params.path));
    if (contentType) headers["Content-Type"] = contentType;

    return new Response(contents, {
      status: 200,
      headers,
    });
  };
}

function collectEntrypoints(
  dev: boolean,
  islands: Island[],
  plugins: Plugin[],
): Record<string, string> {
  const entrypointBase = "../runtime/entrypoints";
  const entryPoints: Record<string, string> = {
    main: dev
      ? import.meta.resolve(`${entrypointBase}/main_dev.ts`)
      : import.meta.resolve(`${entrypointBase}/main.ts`),
    deserializer: import.meta.resolve(`${entrypointBase}/deserializer.ts`),
  };

  try {
    import.meta.resolve("@preact/signals");
    entryPoints.signals = import.meta.resolve(`${entrypointBase}/signals.ts`);
  } catch {
    // @preact/signals is not in the import map
  }

  for (const island of islands) {
    entryPoints[`island-${island.id}`] = island.url;
  }

  for (const plugin of plugins) {
    for (const [name, url] of Object.entries(plugin.entrypoints ?? {})) {
      entryPoints[`plugin-${plugin.name}-${name}`] = url;
    }
  }

  return entryPoints;
}
