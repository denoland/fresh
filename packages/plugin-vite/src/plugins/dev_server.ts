import type { DevEnvironment, Plugin } from "vite";
import * as path from "@std/path";
import { connect } from "node:net";
import { ASSET_CACHE_BUST_KEY } from "fresh/internal";
import { createRequest, sendResponse } from "@remix-run/node-fetch-server";
import { hashCode } from "../shared.ts";

export function devServer(): Plugin[] {
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

        // Start a Deno HTTP server on a random port to handle WebSocket
        // upgrades. Vite's Connect-based server fires 'upgrade' events
        // on the underlying http.Server, but those never reach Connect
        // middleware. We proxy upgrade requests to this Deno server
        // where Deno.upgradeWebSocket() works natively.
        let wsPort = 0;
        const wsServer = Deno.serve(
          { port: 0, onListen: ({ port }) => wsPort = port },
          async (req) => {
            try {
              const mod = await server.ssrLoadModule("fresh:server_entry");
              return (await mod.default.fetch(req)) as Response;
            } catch {
              return new Response("Internal Server Error", { status: 500 });
            }
          },
        );

        const originalClose = server.close;
        server.close = async () => {
          await wsServer.shutdown();
          return originalClose.call(server);
        };

        server.httpServer?.on(
          "upgrade",
          (
            req: {
              url?: string;
              method: string;
              httpVersion: string;
              rawHeaders: string[];
            },
            clientSocket: import("node:net").Socket,
            head: Buffer,
          ) => {
            // Let Vite handle its own HMR WebSocket upgrades
            if (
              req.url === "/__vite_hmr" ||
              req.url === "/__vite_ping"
            ) {
              return;
            }

            const proxySocket = connect(wsPort, "127.0.0.1", () => {
              // Rebuild the HTTP upgrade request for the Deno server
              let raw = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
              for (let i = 0; i < req.rawHeaders.length; i += 2) {
                raw += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`;
              }
              raw += "\r\n";

              proxySocket.write(raw);
              if (head.length > 0) proxySocket.write(head);

              clientSocket.pipe(proxySocket);
              proxySocket.pipe(clientSocket);
            });

            proxySocket.on("error", () => clientSocket.destroy());
            clientSocket.on("error", () => proxySocket.destroy());
          },
        );

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

          const decodedPathname = decodeURIComponent(url.pathname.slice(1));

          // Check if it's a static file first
          const staticFilePath = path.join(publicDir, decodedPathname);
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
            decodedPathname,
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

          try {
            const mod = await server.ssrLoadModule("fresh:server_entry");
            const req = createRequest(nodeReq, nodeRes);
            mod.setErrorInterceptor((err: unknown) => {
              if (err instanceof Error) {
                server.ssrFixStacktrace(err);
              }
            });

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
            if (err instanceof Error) {
              server.ssrFixStacktrace(err);
            }
            return next(err);
          }
        });
      },
    },
    {
      name: "fresh:server_hmr",
      applyToEnvironment(env) {
        return env.config.consumer === "server";
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
