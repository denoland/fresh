import { MiddlewareHandlerContext } from "$fresh/server.ts";

export async function handler(_req: Request, ctx: MiddlewareHandlerContext) {
  ctx.state.test = "look, i'm set from a plugin!";
  const resp = await ctx.next();
  return resp;
}
