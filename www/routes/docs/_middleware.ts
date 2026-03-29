import type { Context } from "fresh";

const REDIRECTS: Record<string, string> = {
  "/docs/getting-started/fetching-data":
    "/docs/getting-started/custom-handlers",
};

export async function handler<T>(ctx: Context<T>) {
  const { pathname } = ctx.url;

  // Redirect /docs/canary/... to /docs/... since canary docs
  // have been merged into latest
  if (pathname.startsWith("/docs/canary/")) {
    const rest = pathname.slice("/docs/canary".length);
    const url = new URL(`/docs${rest}`, ctx.url.origin);
    return new Response("", {
      status: 301,
      headers: { location: url.href },
    });
  }

  // Redirect from old doc URLs to new ones
  const redirect = REDIRECTS[pathname];
  if (redirect) {
    const url = new URL(redirect, ctx.url.origin);
    return new Response("", {
      status: 307,
      headers: { location: url.href },
    });
  }

  return await ctx.next();
}
