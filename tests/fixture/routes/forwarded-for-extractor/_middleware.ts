import { MiddlewareHandlerContext } from "$fresh/server.ts";

export async function handler(
  _req: Request,
  ctx: MiddlewareHandlerContext,
) {
  ctx.state.forwarded = ctx.forwardedForAddr?.hostname;
  return await ctx.next();
}
