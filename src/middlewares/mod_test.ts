import { compileMiddlewares } from "./mod.ts";
import { expect } from "@std/expect";
import { serveMiddleware } from "../test_utils.ts";
import type { MiddlewareFn } from "./mod.ts";

const THROWER = () => {
  throw new Error("fail");
};

Deno.test("compileMiddlewares", async () => {
  const middlewares: MiddlewareFn<{ text: string }>[] = [
    (ctx) => {
      ctx.state.text = "A";
      return ctx.next();
    },
    (ctx) => {
      ctx.state.text += "B";
      return ctx.next();
    },
    async (ctx) => {
      const res = await ctx.next();
      ctx.state.text += "C"; // This should not show up
      return res;
    },
    (ctx) => {
      return new Response(ctx.state.text);
    },
  ];

  const server = serveMiddleware<{ text: string }>(
    compileMiddlewares(middlewares, THROWER),
  );

  const res = await server.get("/");
  expect(await res.text()).toEqual("AB");
});

Deno.test("compileMiddlewares - middlewares should only be called once", async () => {
  type State = { count: number };
  const A: MiddlewareFn<State> = (ctx) => {
    if (ctx.state.count === undefined) {
      ctx.state.count = 0;
    } else {
      ctx.state.count++;
    }
    return ctx.next();
  };

  const final: MiddlewareFn<State> = (ctx) =>
    new Response(String(ctx.state.count));

  const server = serveMiddleware<{ count: number }>(
    compileMiddlewares([A], final),
  );

  const res = await server.get("/");
  expect(await res.text()).toEqual("0");
});

Deno.test("runMiddleware - runs multiple stacks", async () => {
  type State = { text: string };
  const A: MiddlewareFn<State> = (ctx) => {
    ctx.state.text = "A";
    return ctx.next();
  };
  const B: MiddlewareFn<State> = (ctx) => {
    ctx.state.text += "B";
    return ctx.next();
  };
  const C: MiddlewareFn<State> = (ctx) => {
    ctx.state.text += "C";
    return ctx.next();
  };
  const D: MiddlewareFn<State> = (ctx) => {
    ctx.state.text += "D";
    return ctx.next();
  };

  const final: MiddlewareFn<State> = (ctx) =>
    new Response(String(ctx.state.text));

  const server = serveMiddleware<State>(compileMiddlewares(
    [A, B, C, D],
    final,
  ));

  const res = await server.get("/");
  expect(await res.text()).toEqual("ABCD");
});

Deno.test("runMiddleware - throws errors", async () => {
  let thrownA: unknown = null;
  let thrownB: unknown = null;
  let thrownC: unknown = null;

  const middlewares: MiddlewareFn<{ text: string }>[] = [
    async (ctx) => {
      try {
        return await ctx.next();
      } catch (err) {
        thrownA = err;
        throw err;
      }
    },
    async (ctx) => {
      try {
        return await ctx.next();
      } catch (err) {
        thrownB = err;
        throw err;
      }
    },
    async (ctx) => {
      try {
        return await ctx.next();
      } catch (err) {
        thrownC = err;
        throw err;
      }
    },
  ];

  const final = () => {
    throw new Error("fail");
  };

  const server = serveMiddleware<{ text: string }>(
    compileMiddlewares(middlewares, final),
  );

  try {
    await server.get("/");
  } catch {
    // ignore
  }
  expect(thrownA).toBeInstanceOf(Error);
  expect(thrownB).toBeInstanceOf(Error);
  expect(thrownC).toBeInstanceOf(Error);
});
