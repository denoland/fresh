import { FreshContext } from "$fresh/server.ts";

export async function handler(
  req: Request,
  ctx: FreshContext,
) {
  const url = new URL(req.url);
  const hasTrailingSlash = url.pathname.endsWith("/");

  ctx.state.hasTrailingSlash = hasTrailingSlash;
  return await ctx.next();
}
