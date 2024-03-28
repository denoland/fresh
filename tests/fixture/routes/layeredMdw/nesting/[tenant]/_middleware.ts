import type { FreshContext } from "$fresh/server.ts";

export async function handler(_req: Request, ctx: FreshContext) {
  ctx.state.middlewareNestingOrder += "2";
  const resp = await ctx.next();
  return resp;
}
