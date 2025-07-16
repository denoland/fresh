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

Deno.bench("fresh", async () => {
  const freshContext = {
    state: { count: 0 },
    next: () => Promise.resolve({}),
  };

  const res = await runMiddlewares(fresh, freshContext as any);
  const txt = await res.text();
  if (txt !== "10") throw new Error("failed " + txt);
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
  prependMid,
];

let prepared: (ctx: { state: { count: number } }) => Promise<Response>;

for (let i = preparedRaw.length - 1; i >= 0; i--) {
  if (i === preparedRaw.length - 1) {
    prepared = (ctx) => Promise.resolve(new Response(String(ctx.state.count)));
  } else {
    let prev = prepared;
    prepared = (ctx) => preparedRaw[i](ctx, () => prev(ctx));
  }
}

Deno.bench("prepared", async () => {
  const freshContext = {
    state: { count: 0 },
    next: () => Promise.resolve({}),
  };

  const res = await prepared(freshContext);
  const txt = await res.text();
  if (txt !== "10") throw new Error("failed " + txt);
});

type BoundMid = (
  next: () => Promise<Response>,
  ctx: { state: { count: number } },
) => Promise<Response>;

const boundMid: BoundMid = async (next, ctx) => {
  ctx.state.count++;
  return await next();
};

const boundRaw: BoundMid[] = [
  boundMid,
  boundMid,
  boundMid,
  boundMid,
  boundMid,
  boundMid,
  boundMid,
  boundMid,
  boundMid,
  boundMid,
];

// let boundFn: BoundMid;

// for (let i = boundRaw.length - 1; i >= 0; i--) {
//   if (i === boundRaw.length - 1) {
//     boundFn = (_, ctx) =>
//       Promise.resolve(new Response(String(ctx.state.count)));
//   } else {
//     const prev = boundFn;
//     boundFn = boundRaw[i].bind(null, () => prev(ctx));
//   }
// }
// const boundRaw: BoundMid[] = [
//   boundMid,
//   boundMid,
//   boundMid,
//   boundMid,
//   boundMid,
//   boundMid,
//   boundMid,
//   boundMid,
//   boundMid,
//   boundMid,
// ];

// let boundFn: BoundMid

// for (let i = boundRaw.length - 1; i >= 0; i--) {
//   if (i === boundRaw.length - 1) {
//     boundFn = (_, ctx) => Promise.resolve(new Response(String(ctx.state.count)));
//   } else {
//     const prev = boundFn
//     boundFn = boundRaw[i].bind(null, () => prev(ctx))
//   }
// }

// Deno.bench("bind", async () => {
//     const freshContext = {
//     state: { count: 0 },
//     next: () => Promise.resolve({}),
//   };

//   const res = await prepared(freshContext);
//   const txt = await res.text();
//   if (txt !== "10") throw new Error("failed");
// });
