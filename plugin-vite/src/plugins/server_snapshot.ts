import type { Manifest, Plugin, ViteDevServer } from "vite";
import {
  crawlFsItem,
  fsAdapter,
  generateSnapshotServer,
  type IslandModChunk,
  pathToSpec,
  type PendingStaticFile,
  specToName,
  UniqueNamer,
} from "fresh/internal-dev";
import { pathWithRoot, type ResolvedFreshViteConfig } from "../utils.ts";
import * as path from "@std/path";
import { getBuildId } from "./build_id.ts";

export function serverSnapshot(options: ResolvedFreshViteConfig): Plugin {
  const modName = "fresh:server-snapshot";

  let isDev = false;
  let server: ViteDevServer | undefined;

  const namer = new UniqueNamer();

  let clientOutDir = "";
  let root = "";
  let publicDir = "";

  return {
    name: "fresh:server-snapshot",
    applyToEnvironment(env) {
      return env.name === "ssr";
    },
    config(_, env) {
      isDev = env.command === "serve";
    },
    configResolved(config) {
      root = config.root;

      publicDir = pathWithRoot(config.publicDir, config.root);
      clientOutDir = pathWithRoot(
        config.environments.client.build.outDir,
        config.root,
      );
    },
    configureServer(viteServer) {
      server = viteServer;
    },
    async buildStart() {
    },
    resolveId(id) {
      if (id === modName) {
        return `\0${modName}`;
      }
    },
    async load(id) {
      if (id !== `\0${modName}`) return;

      const result = await crawlFsItem({
        islandDir: options.islandsDir,
        routeDir: options.routeDir,
        ignore: options.ignore,
      });

      const islands = new Map<string, { name: string; chunk: string | null }>();
      for (let i = 0; i < result.islands.length; i++) {
        const spec = result.islands[i];
        const specName = specToName(spec);
        const name = namer.getUniqueName(specName);
        islands.set(spec, { name, chunk: null });
      }

      const staticFiles: PendingStaticFile[] = [];
      let islandMods: IslandModChunk[] = [];
      let clientEntry = "/@id/fresh:client-entry";
      let buildId = "";

      if (isDev && server !== undefined) {
        for (const id of islands.keys()) {
          const mod = server.environments.client.moduleGraph.getModuleById(
            id,
          );
          if (mod !== undefined) {
            const def = islands.get(id);
            if (def !== undefined) def.chunk = mod.url;
          }
        }

        islandMods = Array.from(islands.entries()).map(([id, def]) => {
          return {
            name: def.name,
            server: id,
            browser: def.chunk ?? `/@id/${id}`,
          };
        });
      } else {
        buildId = await getBuildId(false);
        const manifest = JSON.parse(
          await Deno.readTextFile(
            path.join(clientOutDir, ".vite", "manifest.json"),
          ),
        ) as Manifest;

        for (const chunk of Object.values(manifest)) {
          if (chunk.name === "client-entry") {
            clientEntry = pathToSpec(clientOutDir, chunk.file);
          }

          staticFiles.push({
            filePath: path.join(clientOutDir, chunk.file),
            pathname: chunk.file,
            hash: null,
          });

          const namer = new UniqueNamer();
          if (chunk.name === "client-snapshot") {
            for (const id of chunk.dynamicImports ?? []) {
              const mod = manifest[id];
              const serverPath = path.join(root, mod.src ?? id);

              const name = namer.getUniqueName(specToName(id));
              islandMods.push({
                name,
                browser: pathToSpec(clientOutDir, mod.file),
                server: serverPath,
              });
            }
          }
        }

        const entries = await fsAdapter.walk(
          publicDir,
          {
            followSymlinks: false,
            includeDirs: false,
            includeFiles: true,
            skip: options.ignore,
          },
        );

        for await (const entry of entries) {
          const relative = path.relative(publicDir, entry.path);
          const filePath = path.join(clientOutDir, relative);

          try {
            await Deno.mkdir(path.dirname(filePath), { recursive: true });
          } catch (err) {
            if (!(err instanceof Deno.errors.AlreadyExists)) {
              throw err;
            }
          }
          await Deno.copyFile(entry.path, filePath);

          staticFiles.push({
            filePath,
            hash: null,
            pathname: relative,
          });
        }
      }

      const code = await generateSnapshotServer({
        outDir: root,
        staticFiles,
        buildId,
        clientEntry,
        fsRoutesFiles: result.routes,
        islands: islandMods,
        writeSpecifier: (file) => {
          return path.toFileUrl(file).href;
        },
      });

      return code;
    },
  };
}
