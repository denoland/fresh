import { compose } from "./compose.ts";
import { expect } from "jsr:@std/expect";
import { serveMiddleware } from "../test_utils.ts";

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
