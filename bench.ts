import { runMiddlewares } from "./src/middlewares/mod.ts";
import type { MiddlewareFn } from "@fresh/core";

const freshMid: MiddlewareFn<{ count: number }> = async (ctx) => {
  ctx.state.count++;
  return await ctx.next();
};

const fresh: MiddlewareFn<{ count: number }>[] = [
  freshMid,
  freshMid,
  freshMid,
  freshMid,
  freshMid,
  freshMid,
  freshMid,
  freshMid,
  freshMid,
  freshMid,
  (ctx) => Promise.resolve(new Response(String(ctx.state.count))),
];

const freshContext = {
  state: { count: 0 },
  next: () => Promise.resolve({}),
};

Deno.bench("fresh", async () => {
  const res = await runMiddlewares(fresh, freshContext as any);
  const txt = await res.text();
  if (txt !== "10") throw new Error("failed");
});

type PrependMid = (
  ctx: { state: { count: number } },
  next: () => Promise<Response>,
) => Promise<Response>;

const prependMid: PrependMid = async (ctx, next) => {
  ctx.state.count++;
  return await next();
};

const preparedRaw: PrependMid[] = [
  prependMid,
  prependMid,
  prependMid,
  prependMid,
  prependMid,
  prependMid,
  prependMid,
  prependMid,
  prependMid,
  prependMid,
  (ctx) => Promise.resolve(new Response(String(ctx.state.count))),
];

let prepared = preparedRaw.at(-1)!;

for (let i = preparedRaw.length - 1; i >= 0; i--) {
  prepared = (ctx) => preparedRaw[i];
}

Deno.bench("prepared", async () => {
  const res = await runMiddlewares(fresh, freshContext as any);
  const txt = await res.text();
  if (txt !== "foo") throw new Error("failed");
});
