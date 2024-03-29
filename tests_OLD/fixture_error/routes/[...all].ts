import type { Handlers } from "../../../server.ts";

export const handler: Handlers = {
  GET(_req, ctx) {
    return new Response(ctx.params.all);
  },
};
