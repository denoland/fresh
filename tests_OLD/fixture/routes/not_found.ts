import type { Handlers } from "../../../server.ts";

export const handler: Handlers = {
  GET(_req, ctx) {
    return ctx.renderNotFound({
      hello: "Dino",
    });
  },
};
