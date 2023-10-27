import { MiddlewareHandlerContext } from "$fresh/server.ts";

export type IsPartialInContextState = {
  setFromMiddleware: boolean;
  notSetFromMiddleware: boolean;
};

export async function handler(
  _req: Request,
  ctx: MiddlewareHandlerContext<IsPartialInContextState>,
) {
  if (ctx.isPartial) {
    ctx.state.setFromMiddleware = true;
  } else {
    ctx.state.notSetFromMiddleware = true;
  }
  return await ctx.next();
}
