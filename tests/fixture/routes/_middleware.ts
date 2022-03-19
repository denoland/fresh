import { MiddlewareHandlerContext } from "../server_deps.ts";

export async function handler(_req: Request, ctx: MiddlewareHandlerContext) {
  const resp = await ctx.handle({ root: 'root_mw' });
  resp.headers.set("server", "fresh test server");
  return resp;
}
