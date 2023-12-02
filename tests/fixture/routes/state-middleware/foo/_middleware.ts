import { FreshContext } from "$fresh/server.ts";

export const handler = (_req: Request, ctx: FreshContext) => {
  ctx.state.handler2 = "it works";
  return ctx.next();
};
