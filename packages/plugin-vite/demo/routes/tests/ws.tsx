import type { FreshContext } from "fresh";

export const handler = {
  GET(ctx: FreshContext) {
    if (ctx.req.headers.get("upgrade") !== "websocket") {
      return new Response("Not a WebSocket request", { status: 400 });
    }

    const { socket, response } = Deno.upgradeWebSocket(ctx.req);

    socket.addEventListener("message", (event) => {
      socket.send(`echo: ${event.data}`);
    });

    return response;
  },
};
