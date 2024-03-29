import type { Handlers } from "../../../server.ts";

export const handler: Handlers = {
  GET(_req, ctx) {
    return new Response((ctx.remoteAddr as Deno.NetAddr).hostname);
  },
};
