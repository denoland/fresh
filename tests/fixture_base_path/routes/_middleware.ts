import { MiddlewareHandlerContext } from "$fresh/server.ts";

export async function handler(
  _req: Request,
  ctx: MiddlewareHandlerContext<{ data: string }>,
) {
  ctx.state.data = "it works";
  const resp = await ctx.next();
  resp.headers.set("server", "fresh server");
  return resp;
}
