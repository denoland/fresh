// deno-lint-ignore-file require-await
import { trailingSlashes } from "./trailing_slashes.ts";
import { expect } from "@std/expect";
import { serveMiddleware } from "../test_utils.ts";

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
