import type { RouteContext } from "$fresh/server.ts";

// deno-lint-ignore require-await
export default async function Home(_req: Request, ctx: RouteContext) {
  return ctx.renderNotFound();
}
