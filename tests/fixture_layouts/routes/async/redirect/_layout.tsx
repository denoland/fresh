import { LayoutProps, RouteContext } from "$fresh/server.ts";

export default async function AsyncSubLayout(
  req: Request,
  ctx: RouteContext,
  { Component }: LayoutProps,
) {
  await delay(10);
  return new Response(null, {
    status: 307,
    headers: { Location: "/async/sub" },
  });
}
