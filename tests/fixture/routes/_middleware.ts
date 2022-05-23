import { MiddlewareHandlerContext } from "$fresh/server.ts";

export async function handler(_req: Request, ctx: MiddlewareHandlerContext) {
  ctx.state.root = "root_mw";
  const resp = await ctx.next();
  resp.headers.set("server", "fresh test server");
  return resp;
}
