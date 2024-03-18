import { compose } from "./compose.ts";
import { expect } from "@std/expect";
import { serveMiddleware } from "../test_utils.ts";
import { Middleware } from "@fresh/server";

Deno.test("compose", async () => {
  const mid = compose<{ text: string }>([function A(ctx) {
    ctx.state.text = "A";
    return ctx.next();
  }, function B(ctx) {
    ctx.state.text += "B";
    return ctx.next();
  }, async function C(ctx) {
    const res = await ctx.next();
    ctx.state.text += "C"; // This should not show up
    return res;
  }, function R(ctx) {
    return new Response(ctx.state.text);
  }]);

  const server = serveMiddleware(mid);

  const res = await server.get("/");
  expect(await res.text()).toEqual("AB");
});

Deno.test("compose - don't wrap on 1 middleware", () => {
  const A: Middleware = (ctx) => ctx.next();
  const mid = compose<{ text: string }>([A]);
  expect(mid).toEqual(A);
});

Deno.test("compose - middlewares should only be called once", async () => {
  const A: Middleware<{ count: number }> = (ctx) => {
    if (ctx.state.count === undefined) {
      ctx.state.count = 0;
    } else {
      ctx.state.count++;
    }
    return ctx.next();
  };
  const mid = compose<{ count: number }>([
    A,
    (ctx) => new Response(String(ctx.state.count)),
  ]);

  const server = serveMiddleware(mid);

  const res = await server.get("/");
  expect(await res.text()).toEqual("0");
});

Deno.test("compose - multiple compose together", async () => {
  const child1 = compose<{ text: string }>([function A(ctx) {
    ctx.state.text = "A";
    return ctx.next();
  }, function B(ctx) {
    ctx.state.text += "B";
    return ctx.next();
  }]);
  const child2 = compose<{ text: string }>([function C(ctx) {
    ctx.state.text += "C";
    return ctx.next();
  }, function D(ctx) {
    ctx.state.text += "D";
    return ctx.next();
  }]);

  const mid = compose<{ text: string }>([child1, child2, function R(ctx) {
    return new Response(ctx.state.text);
  }]);

  const server = serveMiddleware(mid);

  const res = await server.get("/");
  expect(await res.text()).toEqual("ABCD");
});
