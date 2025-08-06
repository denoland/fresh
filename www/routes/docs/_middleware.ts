import type { Context } from "fresh";

const REDIRECTS: Record<string, string> = {
  "/docs/getting-started/fetching-data":
    "/docs/getting-started/custom-handlers",
};

export async function handler<T>(ctx: Context<T>) {
  // Redirect from old doc URLs to new ones
  const redirect = REDIRECTS[ctx.url.pathname];
  if (redirect) {
    const url = new URL(redirect, ctx.url.origin);
    return new Response("", {
      status: 307,
      headers: { location: url.href },
    });
  }

  return await ctx.next();
}
