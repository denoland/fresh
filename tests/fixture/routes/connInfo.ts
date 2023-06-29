import { MultiHandler } from "../../../server.ts";

export const handler: MultiHandler = {
  GET(_req, ctx) {
    return new Response((ctx.remoteAddr as Deno.NetAddr).hostname);
  },
};
