import { FreshContext } from "$fresh/server.ts";

const REDIRECTS: Record<string, string> = {
  "/docs/getting-started/fetching-data":
    "/docs/getting-started/custom-handlers",
};

export async function handler(
  _req: Request,
  ctx: FreshContext,
) {
  // Redirect from old doc URLs to new ones
  const redirect = REDIRECTS[ctx.url.pathname];
  if (redirect) {
    return ctx.redirect(redirect, 307);
  }

  return await ctx.next();
}
