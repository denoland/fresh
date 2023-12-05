import { FreshContext } from "$fresh/server.ts";

export async function handler(
  _req: Request,
  ctx: FreshContext<{ data: string }>,
) {
  if (ctx.url.pathname === "/foo/bar/middleware-only.css") {
    return new Response(".foo-bar { color: red }", {
      headers: {
        "Content-Type": "text/css",
      },
    });
  }
  ctx.state.data = "middleware is working";
  const resp = await ctx.next();
  resp.headers.set("server", "fresh server");
  return resp;
}
