import { serverCache } from "./server_cache.ts";
import { expect } from "@std/expect";
import { serveMiddleware } from "../test_utils.ts";
import { type MiddlewareFn, runMiddlewares } from "./mod.ts";

// TODO(iuioiua): Use the same cache but delete all keys once
// https://github.com/denoland/deno/issues/29460 is fixed
const webCache = await caches.open(crypto.randomUUID());

Deno.test("serverCache - caches GET requests", async () => {
  const middleware = serverCache(webCache);
  const server = serveMiddleware(middleware, {
    next: () => new Response(crypto.randomUUID()),
  });

  const res1 = await server.get("/foo");
  const body1 = await res1.text();
  expect(res1.status).toEqual(200);

  const res = await server.get("/foo");
  const body2 = await res.text();
  expect(body1).toEqual(body2);
  expect(res.status).toEqual(200);
});

Deno.test("serverCache - doesn't cache non-GET requests", async () => {
  const middleware = serverCache(webCache);
  const server = serveMiddleware(middleware, {
    next: () => new Response(crypto.randomUUID()),
  });

  const res1 = await server.post("/foo");
  const body1 = await res1.text();
  expect(res1.status).toEqual(200);

  const res2 = await server.post("/foo");
  const body2 = await res2.text();
  expect(body1).not.toEqual(body2);
  expect(res2.status).toEqual(200);
});

Deno.test("serverCache - respects the `include` option", async () => {
  const middleware = serverCache(webCache, {
    include: (context) => context.url.pathname === "/cacheable",
  });
  const server = serveMiddleware(middleware, {
    next: () => new Response(crypto.randomUUID()),
  });

  const res1 = await server.get("/cacheable");
  const body1 = await res1.text();
  expect(res1.status).toEqual(200);

  const res2 = await server.get("/cacheable");
  const body2 = await res2.text();
  expect(body1).toEqual(body2);
  expect(res2.status).toEqual(200);

  const res3 = await server.get("/uncacheable");
  const body3 = await res3.text();
  expect(res3.status).toEqual(200);

  const res4 = await server.get("/uncacheable");
  const body4 = await res4.text();
  expect(body3).not.toEqual(body4);
  expect(res4.status).toEqual(200);
});

Deno.test("serverCache - respects the `include` option when middleware set first", async () => {
  const middlewares: MiddlewareFn<{ cacheable: boolean }>[] = [
    serverCache<{ cacheable: boolean }>(webCache, {
      include: (ctx) => ctx.state.cacheable,
    }),
    (ctx) => {
      ctx.state.cacheable = ctx.url.pathname === "/cacheable";
      return ctx.next();
    },
    () => new Response(crypto.randomUUID()),
  ];

  const server = serveMiddleware<{ cacheable: boolean }>((ctx) =>
    runMiddlewares([middlewares], ctx)
  );

  const res1 = await server.get("/cacheable");
  const body1 = await res1.text();
  expect(res1.status).toEqual(200);

  const res2 = await server.get("/cacheable");
  const body2 = await res2.text();
  expect(body1).toEqual(body2);
  expect(res2.status).toEqual(200);

  const res3 = await server.get("/uncacheable");
  const body3 = await res3.text();
  expect(res3.status).toEqual(200);

  const res4 = await server.get("/uncacheable");
  const body4 = await res4.text();
  expect(body3).not.toEqual(body4);
  expect(res4.status).toEqual(200);
});

Deno.test("serverCache - takes search parameters into account", async () => {
  const middleware = serverCache(webCache);
  const server = serveMiddleware(middleware, {
    next: () => new Response(crypto.randomUUID()),
  });

  const res1 = await server.get("/foo?bar=baz");
  const body1 = await res1.text();
  expect(res1.status).toEqual(200);

  const res2 = await server.get("/foo?bar=qux");
  const body2 = await res2.text();
  expect(body1).not.toEqual(body2);
  expect(res2.status).toEqual(200);
});
