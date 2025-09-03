import type { Plugin } from "vite";
import * as path from "@std/path";
import { ASSET_CACHE_BUST_KEY } from "fresh/internal";
import { createRequest, sendResponse } from "@mjackson/node-fetch-server";

export function devServer(): Plugin[] {
  return [
    {
      name: "fresh:dev_server",
      configureServer(server) {
        const IGNORE_URLS = /^\/(@(vite|fs|id)|\.vite)\//;

        server.middlewares.use(async (nodeReq, nodeRes, next) => {
          const serverCfg = server.config.server;

          console.log(
            {
              ssr: Array.from(
                server.environments.ssr.moduleGraph.idToModuleMap.keys(),
              ).filter((x) => x.includes(".css")),
              client: Array.from(
                server.environments.client.moduleGraph.idToModuleMap.keys(),
              ).filter((x) => x.includes(".css")),
              tw: server.environments.client.moduleGraph.getModuleById(
                "/Users/marvinh/dev/denoland/fresh/packages/plugin-vite/demo/assets/style.css",
              ),
            },
          );

          const protocol = serverCfg.https ? "https" : "http";
          const host = serverCfg.host ? serverCfg.host : "localhost";
          const port = serverCfg.port;
          const url = new URL(
            `${protocol}://${host}:${port}${nodeReq.url ?? "/"}`,
          );

          // Don't cache in dev
          url.searchParams.delete(ASSET_CACHE_BUST_KEY);

          // Check if it's a vite url
          if (
            IGNORE_URLS.test(url.pathname) ||
            server.environments.client.moduleGraph.urlToModuleMap.has(
              url.pathname,
            ) ||
            url.pathname === "/.well-known/appspecific/com.chrome.devtools.json"
          ) {
            return next();
          }

          // Check if it's a static file first
          if (url.pathname !== "/") {
            const ext = path.extname(url.pathname);
            if (ext !== "") {
              return next();
            }
          }

          const mod = await server.ssrLoadModule("fresh:server_entry");

          try {
            const req = createRequest(nodeReq, nodeRes);
            const res = await mod.default.fetch(req);
            await sendResponse(nodeRes, res);
          } catch (err) {
            return next(err);
          }
        });
      },
    },
    {
      name: "fresh:server_hmr",
      applyToEnvironment(env) {
        return env.name === "ssr";
      },
      hotUpdate(options) {
        const clientMod = options.server.environments.client.moduleGraph
          .getModulesByFile(options.file);

        if (clientMod !== undefined) {
          // Vite can do HMR here
          return;
        }

        const ssrMod = options.server.environments.ssr.moduleGraph
          .getModulesByFile(options.file);
        if (ssrMod !== undefined) {
          // SSR-only module. Might still be a route.
          // TODO: Implement proper ssr hmr
          options.server.hot.send("fresh:reload");
        }
      },
    },
  ];
}
