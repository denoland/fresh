import { LayoutProps, RouteContext } from "$fresh/server.ts";
import { delay } from "$std/async/delay.ts";

export default async function AsyncLayout(
  req: Request,
  ctx: RouteContext,
  { Component }: LayoutProps,
) {
  await delay(10);
  return (
    <div class="layout">
      <p>Async layout</p>
      <Component />
    </div>
  );
}
