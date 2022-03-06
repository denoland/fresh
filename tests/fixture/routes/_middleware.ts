import { MiddlewareHandlerContext } from "../server_deps.ts";

export async function handler(_req: Request, ctx: MiddlewareHandlerContext) {
  const resp = await ctx.handle();
  resp.headers.set("server", "fresh test server");
  return resp;
}
