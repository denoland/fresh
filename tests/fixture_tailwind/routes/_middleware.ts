import type { FreshContext } from "$fresh/server.ts";

export async function handler(
  _req: Request,
  ctx: FreshContext,
) {
  if (ctx.url.pathname === "/middleware-only.css") {
    return new Response(".foo-bar { color: red }", {
      headers: {
        "Content-Type": "text/css",
      },
    });
  }
  return await ctx.next();
}
