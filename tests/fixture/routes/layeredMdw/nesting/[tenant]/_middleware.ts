import { MiddlewareHandlerContext } from "$fresh/server.ts";

export async function handler(_req: Request, ctx: MiddlewareHandlerContext) {
  ctx.state.middlewareNestingOrder += "2";
  const resp = await ctx.next();
  return resp;
}
