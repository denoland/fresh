import type { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(_req, _ctx) {
    throw new Deno.errors.NotFound();
  },
};
