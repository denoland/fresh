import { compose } from "./compose.ts";
import { expect } from "jsr:@std/expect";
import { serveMiddleware } from "../test_utils.ts";
import { Middleware } from "$fresh/src/_next/middlewares/compose.ts";

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
