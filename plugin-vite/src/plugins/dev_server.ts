import type { Plugin } from "vite";
import { nodeToRequest, responseToNode } from "../request.ts";
import * as path from "@std/path";
import { pathWithRoot } from "../utils.ts";

export function devServer(): Plugin[] {
  let publicDir = "";

  return [
    {
      name: "fresh:dev_server",
      configResolved(cfg) {
        publicDir = pathWithRoot(cfg.publicDir, cfg.root);
      },
      configureServer(server) {
        const IGNORE_URLS = /^\/(@(vite|fs|id)|\.vite)\//;

        server.middlewares.use(async (nodeReq, nodeRes, next) => {
          const serverCfg = server.config.server;

          const protocol = serverCfg.https ? "https" : "http";
          const host = serverCfg.host ? serverCfg.host : "localhost";
          const port = serverCfg.port;
          const url = new URL(
            `${protocol}://${host}:${port}${nodeReq.url ?? "/"}`,
          );

          // Check if it's a vite url
          if (
            IGNORE_URLS.test(url.pathname) ||
            server.environments.client.moduleGraph.urlToModuleMap.has(
              url.pathname,
            )
          ) {
            return next();
          }

          // Check if it's a static file first
          // FIXME: Should this still go through fresh?
          if (url.pathname !== "/") {
            try {
              await Deno.stat(path.join(publicDir, url.pathname));
              return next();
            } catch (err) {
              if (!(err instanceof Deno.errors.NotFound)) {
                return next(err);
              }
            }
          }

          const mod = await server.ssrLoadModule("fresh:server_entry");

          try {
            const req = nodeToRequest(nodeReq, url);
            const res = await mod.default.fetch(req);
            await responseToNode(res, nodeRes);
            return nodeRes;
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

        if (clientMod === undefined) {
          options.server.hot.send("fresh:reload");
        }
      },
    },
  ];
}
