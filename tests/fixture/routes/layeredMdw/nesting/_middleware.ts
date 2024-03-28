import type { FreshContext } from "$fresh/server.ts";

export async function handler(_req: Request, ctx: FreshContext) {
  ctx.state.middlewareNestingOrder = "1";
  const resp = await ctx.next();
  return resp;
}
