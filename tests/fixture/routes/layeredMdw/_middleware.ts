import { MiddlewareHandlerContext } from "../../server_deps.ts";

export async function handler(_req: Request, ctx: MiddlewareHandlerContext) {
  const resp = await ctx.handle({ layer1: "layer1_mw" });
  resp.headers.set("server", "fresh test server layer1");
  return resp;
}
