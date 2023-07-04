import { Handlers } from "../../../server.ts";

export const handlers: Handlers = {
  GET() {
    return new Response("Valid handlers");
  },
};
