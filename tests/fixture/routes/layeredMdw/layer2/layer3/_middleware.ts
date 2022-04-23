import { MiddlewareHandlerContext } from "../../../../server_deps.ts";

export async function handler(_req: Request, ctx: MiddlewareHandlerContext) {
  ctx.state.layer3 = "layer3_mw";
  const resp = await ctx.next();
  resp.headers.set("server", "fresh test server layer3");
  resp.headers.set("layer3", "fresh test server layer3");
  return resp;
}
