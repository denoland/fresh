import { MiddlewareHandlerContext } from "$fresh/server.ts";

export async function handler(_req: Request, ctx: MiddlewareHandlerContext) {
  const resp = await ctx.next();
  resp.headers.set("middlewareParams", JSON.stringify(ctx.middlewareParams));
  return resp;
}
