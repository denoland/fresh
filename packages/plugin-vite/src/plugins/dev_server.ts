import type { DevEnvironment, Plugin, ViteDevServer } from "vite";
import * as path from "@std/path";
import { ASSET_CACHE_BUST_KEY } from "fresh/internal";
import { createRequest, sendResponse } from "@mjackson/node-fetch-server";
import { hashCode } from "../shared.ts";
import type { ResolvedFreshViteConfig } from "../utils.ts";

export function devServer(state: ResolvedFreshViteConfig): Plugin[] {
  let publicDir = "";

  return [
    {
      name: "fresh:dev_server",
      sharedDuringBuild: true,
      configResolved(config) {
        publicDir = config.publicDir;
      },
      configureServer(server) {
        const IGNORE_URLS = /^\/(@(vite|fs|id)|\.vite)\//;

        server.watcher.on("add", (filePath) => {
          if (!isIslandPath(state, filePath)) return;

          let name = state.islandNameBySpec.get(filePath);
          if (name === undefined) {
            
          }
          if (filePath.)
          if (name !== undefined) {
            state.islandNameBySpec.delete(filePath);
            state.islandSpecByName.delete(name);
          }

          // islands.add(filePath);

          invalidateSnapshots(server!);
        });
        server.watcher.on("unlink", (filePath) => {
          if (!isIslandPath(state, filePath)) return;

          const name = state.islandNameBySpec.get(filePath);
          if (name !== undefined) {
            state.islandNameBySpec.delete(filePath);
            state.islandSpecByName.delete(name);
          }

          invalidateSnapshots(server!);
        });

        server.middlewares.use(async (nodeReq, nodeRes, next) => {
          const serverCfg = server.config.server;

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
            server.environments.ssr.moduleGraph.urlToModuleMap.has(
              url.pathname,
            ) ||
            url.pathname === "/.well-known/appspecific/com.chrome.devtools.json"
          ) {
            return next();
          }

          // Check if it's a static file first
          const staticFilePath = path.join(publicDir, url.pathname.slice(1));
          try {
            const stat = await Deno.stat(staticFilePath);
            if (stat.isFile) {
              return next();
            }
          } catch {
            // Ignore
          }

          // Check if it's a static/index.html file
          const staticFilePathIndex = path.join(
            publicDir,
            url.pathname.slice(1),
            "index.html",
          );
          try {
            const content = await Deno.readTextFile(staticFilePathIndex);
            nodeRes.setHeader("Content-Type", "text/html; charset=utf-8");
            nodeRes.end(content);
            return;
          } catch {
            // Ignore
          }

          const mod = await server.ssrLoadModule("fresh:server_entry");

          try {
            const req = createRequest(nodeReq, nodeRes);
            const res = (await mod.default.fetch(req)) as Response;

            // Collect css eagerly to avoid FOUC. This is a workaround for
            // Vite not supporting css natively. It's a bit hacky, but
            // gets the job done.
            if (
              url.pathname !== "/__inspect" &&
              res.headers.get("Content-Type")?.includes("text/html")
            ) {
              const collected = await collectCss(
                "fresh:client-entry",
                server.environments.client,
              );

              let html = await res.text();

              const styles = collected.join("\n");
              html = html.replace("</head>", styles + "</head>");

              const newRes = new Response(html, {
                status: res.status,
                headers: res.headers,
              });
              await sendResponse(nodeRes, newRes);
              return;
            }

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

async function collectCss(
  id: string,
  env: DevEnvironment,
) {
  const seen = new Set<string>();
  const queue: string[] = [id];
  const out: string[] = [];

  let current: string | undefined;
  while ((current = queue.pop()) !== undefined) {
    if (seen.has(current)) continue;
    seen.add(current);

    let mod = env.moduleGraph.idToModuleMap.get(current);
    if (mod === undefined || mod.transformResult === null) {
      // During development assets are loaded lazily, so we need
      // to trigger processing manually.
      await env.fetchModule(current);
      mod = env.moduleGraph.idToModuleMap.get(current) ??
        env.moduleGraph.idToModuleMap.get(`\0${current}`);

      if (mod === undefined) continue;
    }

    if (
      (current.endsWith(".scss") ||
        current.endsWith(".css")) && mod.transformResult
    ) {
      // Since vite stores everything as a JS file we need to
      // extract the CSS out of the JS
      const match = mod.transformResult.code.match(
        /__vite__css\s+=\s+("(?:\\\\|\\"|[^"])*")/,
      );

      if (match !== null) {
        const content = JSON.parse(match[1]);
        out.push(
          `<style type="text/css" vite-module-id="${
            hashCode(id)
          }">${content}</style>`,
        );
      }
    }

    mod.importedModules.forEach((m) => {
      if (m.id === null) return;
      queue.push(m.id);
    });
  }

  return out;
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
