//import {
//  assert,
//  assertEquals,
//} from "https://deno.land/std@0.200.0/testing/asserts.ts";
//import { App } from "./app.ts";
//import { FreshContext } from "./context";
//
//Deno.test("should apply middleware only to matching paths", async () => {
//  const app = new App();
//  const log: string[] = [];
//
//  // Global middleware
//  app.use(async (ctx: FreshContext) => {
//    log.push("global");
//    return await ctx.next();
//  });
//
//  // Path-specific middleware
//  app.use("/api/*", async (ctx: FreshContext) => {
//    log.push("api");
//    return await ctx.next();
//  });
//
// Multiple middleware for a specific path
//  app.use("/users/:id", async (ctx, next) => {
//    log.push("users-1");
//    return await next();
//  }, async (ctx, next) => {
//    log.push(`user-${ctx.params.id}`);
//    return await next();
//  });
//
//  // Add routes
//  app.get("/", () => new Response("Home"));
//  app.get("/api/data", () => new Response("API Data"));
//  app.get("/users/123", () => new Response("User 123"));
//
//  const handler = app.handler();
//
//  // Test home route - should only apply global middleware
//  await handler(new Request("http://localhost:8000/"));
//  assertEquals(log, ["global"]);
//  log.length = 0;
//
//  // Test API route - should apply global and API middleware
//  await handler(new Request("http://localhost:8000/api/data"));
//  assertEquals(log, ["global", "api"]);
//  log.length = 0;
//
//  // Test user route - should apply global and user middleware
//  await handler(new Request("http://localhost:8000/users/123"));
//  assertEquals(log, ["global", "users-1", "user-123"]);
//});

//Deno.test("should extract params from middleware patterns", async () => {
//  const app = new App();
//  let params = {};
//
//  app.use("/users/:id", async (ctx, next) => {
//    params = { ...ctx.params };
//    return await next();
//  });
//
//  app.get("/users/123", () => new Response("User 123"));
//
//  const handler = app.handler();
//  await handler(new Request("http://localhost:8000/users/123"));
//
//  assertEquals(params, { id: "123" });
//});
//
//Deno.test("should handle middleware and routes in the correct order", async () => {
//  const app = new App();
//  const order: string[] = [];
//
//  app.use(async (ctx, next) => {
//    order.push("global-1");
//    const res = await next();
//    order.push("global-1-after");
//    return res;
//  });
//
//  app.use("/api/*", async (ctx, next) => {
//    order.push("api-middleware");
//    const res = await next();
//    order.push("api-middleware-after");
//    return res;
//  });
//
//  app.use(async (ctx, next) => {
//    order.push("global-2");
//    const res = await next();
//    order.push("global-2-after");
//    return res;
//  });
//
//  app.get("/api/data", () => {
//    order.push("api-handler");
//    return new Response("API Data");
//  });
//
//  const handler = app.handler();
//  await handler(new Request("http://localhost:8000/api/data"));
//
//  assertEquals(order, [
//    "global-1",
//    "api-middleware",
//    "global-2",
//    "api-handler",
//    "global-2-after",
//    "api-middleware-after",
//    "global-1-after",
//  ]);
//});
