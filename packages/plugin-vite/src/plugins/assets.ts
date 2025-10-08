import type { Plugin } from "vite";
import { fsAdapter, UniqueNamer } from "@fresh/core/internal-dev";
import * as path from "@std/path";

export function assetPlugin(): Plugin[] {
  const urlToName = new Map<string, string>();
  const nameToUrl = new Map<string, string>();
  const namer = new UniqueNamer();
  let publicDir = "";

  return [
    {
      name: "fresh:assets",
      async config() {
        return {
          environments: {
            client: {
              build: {
                rollupOptions: {
                  input: {
                    "fresh-client-assets": "fresh:client-assets",
                  },
                },
              },
            },
          },
        };
      },
      async configResolved(config) {
        publicDir = config.publicDir;

        for await (
          const file of fsAdapter.walk(config.publicDir, {
            includeFiles: true,
            includeDirs: false,
            match: [/\.css$/],
          })
        ) {
          const relative = path.relative(config.publicDir, file.path);
          const pathname = "/" + relative.replaceAll(/[/\\]/g, "/");
          const name = namer.getUniqueName(pathname);
          urlToName.set(pathname, name);
          nameToUrl.set(name, pathname);
        }
      },
      configureServer(server) {
        // server.watcher.
        server.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url!, "http://localhost");

          if (url.pathname.endsWith(".css")) {
            console.log({ urlToName, url: url.pathname });
          }

          const name = urlToName.get(url.pathname);
          if (name !== undefined) {
            // Prefetch
            await server.environments.client.fetchModule(
              `fresh-asset::${name}`,
            );

            const mod = server.environments.client.moduleGraph.getModuleById(
              `\0fresh-asset::${name}`,
            );

            console.log(mod);
          }

          return next();
        });
      },
      resolveId: {
        filter: {
          id: /fresh:client-assets/,
        },
        handler() {
          return `\0fresh:client-assets`;
        },
      },
      load: {
        filter: {
          id: /\0fresh:client-assets/,
        },
        handler() {
          let code = `// Fresh assets\n`;
          for (const name of urlToName.values()) {
            code += `await import("fresh-asset::${name}");\n`;
          }

          code += `export default {}`;

          return code;
        },
      },
    },
    {
      name: "fresh:asset-resolve",
      resolveId: {
        filter: {
          id: /fresh-asset::/,
        },
        handler(id) {
          return `\0${id}`;
        },
      },
      load: {
        filter: {
          id: /\0fresh-asset::/,
        },
        async handler(id) {
          const name = id.slice("\0fresh-asset::".length);
          const url = nameToUrl.get(name)!;

          const file = path.join(publicDir, url.slice(1));

          const mod = await this.load({ id: file });

          return await Deno.readTextFile(file);

          console.log("resolve", mod);
          return `export {}`;
        },
      },
    },
  ];
}
