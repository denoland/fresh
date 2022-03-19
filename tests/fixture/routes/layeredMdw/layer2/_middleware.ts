import { MiddlewareHandlerContext } from "../../../server_deps.ts";

export async function handler(_req: Request, ctx: MiddlewareHandlerContext) {
  const resp = await ctx.handle({ ...ctx.state, layer2: "layer2_mw" });
  return resp;
}
