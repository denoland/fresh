import { MultiHandler } from "../../../server.ts";

export const handler: MultiHandler = {
  GET(_req, ctx) {
    return ctx.renderNotFound({
      hello: "Dino",
    });
  },
};
