import type { Handlers } from "../../../server.ts";

export const handlers: Handlers = {
  GET() {
    throw new Error("FAIL");
  },
};
