// deno-lint-ignore-file require-await
import { compose, trailingSlashes } from "./middlewares.ts";
import { expect } from "jsr:@std/expect";
import { serveMiddleware } from "./test_utils.ts";

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

Deno.test("trailingSlashes - always", async () => {
  const middleware = trailingSlashes("always");
  const server = serveMiddleware(async (ctx) => {
    ctx.next = async () => new Response("ok");
    return await middleware(ctx);
  });

  let res = await server.get("/");
  await res.body?.cancel();
  expect(res.status).toEqual(200);
  expect(res.headers.get("Location")).toEqual(null);

  res = await server.get("/foo");
  await res.body?.cancel();
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/foo/");

  res = await server.get("/foo/bar");
  await res.body?.cancel();
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/foo/bar/");

  res = await server.get("/foo/bar/");
  await res.body?.cancel();
  expect(res.status).toEqual(200);
  expect(res.headers.get("Location")).toEqual(null);
});

Deno.test("trailingSlashes - never", async () => {
  const middleware = trailingSlashes("never");
  const server = serveMiddleware(async (ctx) => {
    ctx.next = async () => new Response("ok");
    return await middleware(ctx);
  });

  let res = await server.get("/");
  await res.body?.cancel();
  expect(res.status).toEqual(200);
  expect(res.headers.get("Location")).toEqual(null);

  res = await server.get("/foo");
  await res.body?.cancel();
  expect(res.status).toEqual(200);
  expect(res.headers.get("Location")).toEqual(null);

  res = await server.get("/foo/");
  await res.body?.cancel();
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/foo");
});
