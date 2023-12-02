import { FreshContext } from "$fresh/server.ts";

export async function handler(
  _req: Request,
  ctx: FreshContext<{ data: string }>,
) {
  ctx.state.data = "it works";
  const resp = await ctx.next();
  resp.headers.set("server", "fresh server");
  return resp;
}
