import { MiddlewareHandlerContext } from "$fresh/server.ts";

export async function handler(req: Request, ctx: MiddlewareHandlerContext) {
  console.log(ctx.destination);
  console.log(req.url);
  const resp = await ctx.next();
  return resp;
}
