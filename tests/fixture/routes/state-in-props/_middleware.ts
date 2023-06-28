import { MiddlewareHandlerContext } from "$fresh/server.ts";

export async function handler(
  _req: Request,
  ctx: MiddlewareHandlerContext,
) {
  ctx.state.stateInProps = "look, i am set from middleware";
  const resp = await ctx.next();
  return resp;
}
