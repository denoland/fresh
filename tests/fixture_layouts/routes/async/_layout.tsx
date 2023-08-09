import { LayoutProps, RouteContext } from "$fresh/server.ts";

export default async function AsyncLayout(
  req: Request,
  ctx: RouteContext,
  { Component }: LayoutProps,
) {
  await new Promise((r) => setTimeout(r, 10));
  return (
    <div class="async-layout">
      <p>Async layout</p>
      <Component />
    </div>
  );
}
