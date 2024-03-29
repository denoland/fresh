import type { FreshContext } from "$fresh/server.ts";
import { delay } from "$std/async/delay.ts";

export default async function AsyncLayout(
  req: Request,
  ctx: FreshContext,
) {
  await delay(10);
  return (
    <div class="layout">
      <p>Async layout</p>
      <ctx.Component />
    </div>
  );
}
