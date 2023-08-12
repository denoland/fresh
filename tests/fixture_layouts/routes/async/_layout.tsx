import { LayoutContext } from "$fresh/server.ts";

export default async function AsyncLayout(
  req: Request,
  ctx: LayoutContext,
) {
  await new Promise((r) => setTimeout(r, 10));
  return (
    <div class="async-layout">
      <p>Async layout</p>
      <ctx.Component />
    </div>
  );
}
