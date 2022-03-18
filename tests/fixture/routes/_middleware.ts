import { MiddlewareHandlerContext } from "../server_deps.ts";

export async function handler(_req: Request, ctx: MiddlewareHandlerContext) {
  const data = "this is my state data"
  const resp = await ctx.handle({data});
  resp.headers.set("server", "fresh test server");
  return resp;
}
