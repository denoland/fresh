import { FreshContext } from "$fresh/server.ts";

export async function handler(_req: Request, ctx: FreshContext) {
  const resp = await ctx.next();
  resp.headers.set("middlewareParams_outer", JSON.stringify(ctx.params));
  return resp;
}
