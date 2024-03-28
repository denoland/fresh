import type { FreshContext } from "$fresh/server.ts";

export async function handler(_req: Request, ctx: FreshContext) {
  ctx.state.layer1 = "layer1_mw";
  const resp = await ctx.next();
  resp.headers.set("server", "fresh test server layer1");
  return resp;
}
