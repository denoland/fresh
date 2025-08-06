import type { Plugin, ViteDevServer } from "vite";
import type { ResolvedFreshViteConfig } from "../utils.ts";
import { crawlFsItem } from "fresh/internal-dev";

export function clientSnapshot(options: ResolvedFreshViteConfig): Plugin {
  const modName = "fresh:client-snapshot";

  const islands = new Set<string>();
  let server: ViteDevServer | undefined;
  let isDev = false;

  return {
    name: "fresh:client-snapshot",
    applyToEnvironment(env) {
      return env.name === "client";
    },
    config(_, env) {
      isDev = env.command === "serve";

      return {
        environments: {
          client: {
            build: {
              rollupOptions: {
                input: {
                  "client-snapshot": "fresh:client-snapshot",
                },
              },
            },
          },
        },
      };
    },
    async buildStart() {
      const result = await crawlFsItem({
        islandDir: options.islandsDir,
        routeDir: options.routeDir,
        ignore: options.ignore,
      });

      for (let i = 0; i < result.islands.length; i++) {
        const filePath = result.islands[i];
        islands.add(filePath);
      }
    },
    resolveId(id) {
      if (id === modName) {
        return `\0${modName}`;
      }
    },
    configureServer(devServer) {
      server = devServer;
    },
    load(id) {
      if (id !== `\0${modName}`) return;

      const imports = Array.from(islands.keys()).map((file, i) => {
        return `export const mod_${i} = await import(${JSON.stringify(file)});`;
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
  };
}
