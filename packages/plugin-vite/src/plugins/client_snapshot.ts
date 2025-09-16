import type { Plugin, ViteDevServer } from "vite";
import { pathWithRoot, type ResolvedFreshViteConfig } from "../utils.ts";
import { crawlFsItem, specToName } from "fresh/internal-dev";
import * as path from "@std/path";

export function clientSnapshot(options: ResolvedFreshViteConfig): Plugin[] {
  const modName = "fresh:client-snapshot";

  const islands = new Set<string>();
  let server: ViteDevServer | undefined;
  let isDev = false;

  const entryToIsland = new Map<string, string>();

  return [
    {
      name: "fresh:client-snapshot",
      sharedDuringBuild: true,
      applyToEnvironment(env) {
        return env.name === "client";
      },

      config(_cfg, env) {
        isDev = env.command === "serve";
      },
      async options(opts) {
        const result = await crawlFsItem({
          islandDir: options.islandsDir,
          routeDir: options.routeDir,
          ignore: options.ignore,
        });

        const input: Record<string, string> = {};

        if (isDev) {
          input["client-snapshot"] = "fresh:client-snapshot";
        }

        for (let i = 0; i < result.islands.length; i++) {
          const filePath = result.islands[i];
          islands.add(filePath);

          if (!isDev) {
            const specName = specToName(filePath);
            const name = options.namer.getUniqueName(specName);

            entryToIsland.set(name, filePath);
            input[`fresh-island::${name}`] = `fresh-client-island::${name}`;
          }
        }

        opts.input = input;

        for (const [name, spec] of entryToIsland.entries()) {
          const full = pathWithRoot(spec, options.root);
          entryToIsland.set(name, full);
        }

        options.islandSpecifiers.forEach((_name, spec) => {
          islands.add(spec);

          if (!isDev) {
            const specName = specToName(spec);
            const name = options.namer.getUniqueName(specName);
            entryToIsland.set(name, spec);

            // deno-lint-ignore no-explicit-any
            (opts.input as any)[`fresh-island::${name}`] =
              `fresh-client-island::${name}`;
          }
        });
      },
      configureServer(devServer) {
        server = devServer;

        server.watcher.on("add", (filePath) => {
          if (!isIslandPath(options, filePath)) return;

          islands.add(filePath);

          invalidateSnapshots(server!);
        });
        server.watcher.on("unlink", (filePath) => {
          if (!isIslandPath(options, filePath)) return;

          islands.delete(filePath);

          invalidateSnapshots(server!);
        });
      },
      resolveId: {
        filter: {
          id: /fresh:client-snapshot/,
        },
        handler(id) {
          if (id === modName) {
            return `\0${modName}`;
          }
        },
      },
      load: {
        filter: {
          id: /\0fresh:client-snapshot/,
        },
        handler() {
          const imports = Array.from(islands.keys()).map((file, i) => {
            return `export const mod_${i} = await import(${
              JSON.stringify(file)
            });`;
          }).join("\n");

          if (isDev && server !== undefined) {
            const mod = server.environments.ssr.moduleGraph.getModuleById(
              "\0fresh:server-snapshot",
            );
            if (mod) {
              server.environments.ssr.moduleGraph.invalidateModule(mod);
            }
          }

          return `${imports}
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log("accepting client-snapshot")
  });
}
`;
        },
      },
    },
    {
      name: "fresh:client-island",
      sharedDuringBuild: true,
      applyToEnvironment(env) {
        return env.name === "client";
      },
      resolveId: {
        filter: {
          id: /^fresh-client-island::/,
        },
        handler(id) {
          const name = id.slice("fresh-client-island::".length);
          const full = entryToIsland.get(name);
          return full;
        },
      },
    },
  ];
}

function isIslandPath(
  options: ResolvedFreshViteConfig,
  filePath: string,
): boolean {
  const relIsland = path.relative(options.islandsDir, filePath);
  if (!relIsland.startsWith("..")) return true;

  const relRoutes = path.relative(options.routeDir, filePath);

  if (!relIsland.startsWith("..") && relRoutes.includes("(_islands)")) {
    return true;
  }
  return false;
}

function invalidateSnapshots(server: ViteDevServer) {
  const client = server.environments.client.moduleGraph.getModuleById(
    "\0fresh:client-snapshot",
  );
  if (client !== undefined) {
    server.environments.client.moduleGraph.invalidateModule(client);
  }

  const ssr = server.environments.ssr.moduleGraph.getModuleById(
    "\0fresh:server-snapshot",
  );
  if (ssr !== undefined) {
    server.environments.ssr.moduleGraph.invalidateModule(ssr);
  }
}
