import { HandlerContext } from "../../../server.ts";

export const handler = {
  GET(_ctx: HandlerContext) {
    throw Error("it errored!");
  },
};
