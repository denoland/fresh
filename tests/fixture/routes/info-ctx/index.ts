import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(_req, ctx) {
    return Response.json(
      ctx.info.routes.filter((v) => v.baseRoute === "/info-ctx"),
    );
  },
};
