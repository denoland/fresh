import { Ctx } from "./types.ts";

export function devConnection() {
  return (ctx: Ctx) => {
    const { req } = ctx;
    if (req.headers.get("upgrade") !== "websocket") {
      return new Response(null, { status: 501 });
    }

    // TODO: When a change is made the Deno server restarts,
    // so for now the WebSocket connection is only used for
    // the client to know when the server is back up. Once we
    // have HMR we'll actively start sending messages back
    // and forth.
    const { response } = Deno.upgradeWebSocket(req);

    return response;
  };
}
