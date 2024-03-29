import { runMiddlewares } from "./mod.ts";
import { expect } from "@std/expect";
import { serveMiddleware } from "../test_utils.ts";
import type { Middleware } from "./mod.ts";

Deno.test("runMiddleware", async () => {
  const middlewares: Middleware<{ text: string }>[] = [
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

  const server = serveMiddleware<{ text: string }>((ctx) =>
    runMiddlewares([middlewares], ctx)
  );

  const res = await server.get("/");
  expect(await res.text()).toEqual("AB");
});

Deno.test("runMiddleware - middlewares should only be called once", async () => {
  const A: Middleware<{ count: number }> = (ctx) => {
    if (ctx.state.count === undefined) {
      ctx.state.count = 0;
    } else {
      ctx.state.count++;
    }
    return ctx.next();
  };

  const server = serveMiddleware<{ count: number }>((ctx) =>
    runMiddlewares(
      [[A, (ctx) => new Response(String(ctx.state.count))]],
      ctx,
    )
  );

  const res = await server.get("/");
  expect(await res.text()).toEqual("0");
});

Deno.test("runMiddleware - runs multiple stacks", async () => {
  type State = { text: string };
  const A: Middleware<State> = (ctx) => {
    ctx.state.text += "A";
    return ctx.next();
  };
  const B: Middleware<State> = (ctx) => {
    ctx.state.text += "B";
    return ctx.next();
  };
  const C: Middleware<State> = (ctx) => {
    ctx.state.text += "C";
    return ctx.next();
  };
  const D: Middleware<State> = (ctx) => {
    ctx.state.text += "D";
    return ctx.next();
  };

  const server = serveMiddleware<State>((ctx) => {
    ctx.state.text = "";
    return runMiddlewares(
      [
        [A, B],
        [C, D, (ctx) => new Response(String(ctx.state.text))],
      ],
      ctx,
    );
  });

  const res = await server.get("/");
  expect(await res.text()).toEqual("ABCD");
});
