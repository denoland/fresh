import type { RunnerEvent, RunnerHost } from "../connection.ts";
import type { RunnerCtx } from "../runner_ctx.ts";
import type { ModuleInstance } from "../shared.ts";

export function newBrowserRunner(ctx: RunnerCtx, envName: string): RunnerHost {
  const sockets = new Set<WebSocket>();

  async function onMessage(ev: MessageEvent) {
    const msg = JSON.parse(ev.data) as RunnerEvent;
    switch (msg.type) {
      case "request-module": {
        const mod = await ctx.fetchModule(envName, msg.id);
        for (const socket of sockets.values()) {
          const ev: RunnerEvent = {
            type: "instantiate",
            id: msg.id,
            // deno-lint-ignore no-explicit-any
            code: mod?.content as any, // FIXME
          };
          socket.send(JSON.stringify(ev));
        }
        break;
      }
      case "instantiate":
        break;
    }
  }

  ctx.use(async (req, next) => {
    const url = new URL(req.url);
    if (url.pathname === "/__ws") {
      if (req.headers.get("upgrade") !== "websocket") {
        return new Response(null, { status: 501 });
      }

      const { socket, response } = Deno.upgradeWebSocket(req);
      sockets.add(socket);

      socket.addEventListener("message", onMessage);

      socket.addEventListener("close", () => {
        socket.removeEventListener("message", onMessage);
        sockets.delete(socket);
      });

      return response;
    }

    return await next();
  });

  return {
    // deno-lint-ignore require-await
    async instantiateModule(id, code) {
      const ev: RunnerEvent = {
        type: "instantiate",
        code,
        id,
      };
      const raw = JSON.stringify(ev);

      for (const socket of sockets.values()) {
        socket.send(raw);
      }
    },
    loadModule(_id: string): Promise<ModuleInstance> {
      throw new Error(
        "BrowserRunner doesn't support running modules server side. Use ServerRunner instead.",
      );
    },
  };
}
