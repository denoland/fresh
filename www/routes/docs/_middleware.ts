import type { Context } from "fresh";

const REDIRECTS: Record<string, string> = {
  "/docs/getting-started/fetching-data":
    "/docs/getting-started/custom-handlers",
  "/docs/canary/examples/modifying-the-head": "/docs/canary/advanced/head",
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
