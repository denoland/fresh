import type { FreshContext } from "$fresh/server.ts";
import { delay } from "$fresh/tests/deps.ts";

export default async function AsyncLayout(
  req: Request,
  ctx: FreshContext,
) {
  await delay(10);
  return (
    <div class="async-layout">
      <p>Async layout</p>
      <ctx.Component />
    </div>
  );
}
