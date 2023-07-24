import { MiddlewareHandlerContext } from "$fresh/server.ts";

export const handler = (_req: Request, ctx: MiddlewareHandlerContext) => {
  ctx.state = { handler1: "it works" };
  return ctx.next();
};
