import { LayoutContext } from "$fresh/server.ts";
import { delay } from "$std/async/mod.ts";

export default async function AsyncSubLayout(
  req: Request,
  ctx: LayoutContext,
) {
  await delay(10);
  return new Response(null, {
    status: 307,
    headers: { Location: "/async/sub" },
  });
}
