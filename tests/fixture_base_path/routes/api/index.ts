import { Handlers } from "$fresh/server.ts";

export const handler: Handlers<unknown, { data: string }> = {
  GET(_req, ctx) {
    return new Response(ctx.state.data);
  },
};
