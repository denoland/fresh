import { FreshContext } from "$fresh/server.ts";

export async function handler(_req: Request, ctx: FreshContext) {
  ctx.state.order += "3";
  const resp = await ctx.next();
  return resp;
}
