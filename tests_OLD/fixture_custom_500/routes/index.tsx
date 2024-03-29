import type { Handlers } from "../../../server.ts";

export const handler: Handlers = {
  GET(_req, ctx) {
    throw new Error("Pickle Rick!");
  },
};
