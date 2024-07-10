import type { MiddlewareFn } from "../../middlewares/mod.ts";
import { ALIVE_URL } from "../../constants.ts";

// Live reload: Send updates to browser
export function liveReload<T>(): MiddlewareFn<T> {
  const revision = Date.now();

  return (ctx) => {
    const { config, request, url } = ctx;

    const aliveUrl = config.basePath + ALIVE_URL;

    if (url.pathname === aliveUrl) {
      if (request.headers.get("upgrade") !== "websocket") {
        return new Response(null, { status: 501 });
      }

      // TODO: When a change is made the Deno server restarts,
      // so for now the WebSocket connection is only used for
      // the client to know when the server is back up. Once we
      // have HMR we'll actively start sending messages back
      // and forth.
      const { response, socket } = Deno.upgradeWebSocket(request);

      socket.addEventListener("open", () => {
        socket.send(
          JSON.stringify({
            type: "initial-state",
            revision,
          }),
        );
      });

      return response;
    }

    return ctx.next();
  };
}
