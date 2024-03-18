import { expect } from "@std/expect";
import { FreshApp } from "./app.ts";
import { FakeServer } from "./test_utils.ts";

Deno.test("FreshApp - .use()", async () => {
  const app = new FreshApp<{ text: string }>()
    .use((ctx) => {
      ctx.state.text = "A";
      return ctx.next();
    })
    .use((ctx) => {
      ctx.state.text += "B";
      return ctx.next();
    })
    .use((ctx) => new Response(ctx.state.text));

  const server = new FakeServer(app.handler());

  const res = await server.get("/");
  expect(await res.text()).toEqual("AB");
});

Deno.test("FreshApp - .get()", async () => {
  const app = new FreshApp()
    .post("/", () => new Response("ok"))
    .post("/foo", () => new Response("ok"))
    .get("/", () => new Response("ok"))
    .get("/foo", () => new Response("ok"));

  const server = new FakeServer(app.handler());

  let res = await server.get("/");
  expect(await res.text()).toEqual("ok");

  res = await server.get("/foo");
  expect(await res.text()).toEqual("ok");
});

Deno.test("FreshApp - .get() with basePath", async () => {
  const app = new FreshApp({ basePath: "/foo/bar" })
    .get("/", () => new Response("ok"))
    .get("/foo", () => new Response("ok"));

  const server = new FakeServer(app.handler());

  let res = await server.get("/");
  expect(res.status).toEqual(404);
  res = await server.get("/foo");
  expect(res.status).toEqual(404);

  res = await server.get("/foo/bar");
  expect(res.status).toEqual(200);
  res = await server.get("/foo/bar/foo");
  expect(res.status).toEqual(200);
});

Deno.test("FreshApp - .post()", async () => {
  const app = new FreshApp<{ text: string }>()
    .get("/", () => new Response("fail"))
    .get("/foo", () => new Response("fail"))
    .post("/", () => new Response("ok"))
    .post("/foo", () => new Response("ok"));

  const server = new FakeServer(app.handler());

  let res = await server.post("/");
  expect(await res.text()).toEqual("ok");

  res = await server.post("/foo");
  expect(await res.text()).toEqual("ok");
});

Deno.test("FreshApp - .post() with basePath", async () => {
  const app = new FreshApp({ basePath: "/foo/bar" })
    .post("/", () => new Response("ok"))
    .post("/foo", () => new Response("ok"));

  const server = new FakeServer(app.handler());

  let res = await server.post("/");
  expect(res.status).toEqual(404);
  res = await server.post("/foo");
  expect(res.status).toEqual(404);

  res = await server.post("/foo/bar");
  expect(res.status).toEqual(200);
  res = await server.post("/foo/bar/foo");
  expect(res.status).toEqual(200);
});

Deno.test("FreshApp - .patch()", async () => {
  const app = new FreshApp<{ text: string }>()
    .get("/", () => new Response("fail"))
    .get("/foo", () => new Response("fail"))
    .patch("/", () => new Response("ok"))
    .patch("/foo", () => new Response("ok"));

  const server = new FakeServer(app.handler());

  let res = await server.patch("/");
  expect(await res.text()).toEqual("ok");

  res = await server.patch("/foo");
  expect(await res.text()).toEqual("ok");
});

Deno.test("FreshApp - .patch() with basePath", async () => {
  const app = new FreshApp({ basePath: "/foo/bar" })
    .patch("/", () => new Response("ok"))
    .patch("/foo", () => new Response("ok"));

  const server = new FakeServer(app.handler());

  let res = await server.patch("/");
  expect(res.status).toEqual(404);
  res = await server.patch("/foo");
  expect(res.status).toEqual(404);

  res = await server.patch("/foo/bar");
  expect(res.status).toEqual(200);
  res = await server.patch("/foo/bar/foo");
  expect(res.status).toEqual(200);
});

Deno.test("FreshApp - .put()", async () => {
  const app = new FreshApp<{ text: string }>()
    .get("/", () => new Response("fail"))
    .get("/foo", () => new Response("fail"))
    .put("/", () => new Response("ok"))
    .put("/foo", () => new Response("ok"));

  const server = new FakeServer(app.handler());

  let res = await server.put("/");
  expect(await res.text()).toEqual("ok");

  res = await server.put("/foo");
  expect(await res.text()).toEqual("ok");
});

Deno.test("FreshApp - .put() with basePath", async () => {
  const app = new FreshApp({ basePath: "/foo/bar" })
    .put("/", () => new Response("ok"))
    .put("/foo", () => new Response("ok"));

  const server = new FakeServer(app.handler());

  let res = await server.put("/");
  expect(res.status).toEqual(404);
  res = await server.put("/foo");
  expect(res.status).toEqual(404);

  res = await server.put("/foo/bar");
  expect(res.status).toEqual(200);
  res = await server.put("/foo/bar/foo");
  expect(res.status).toEqual(200);
});

Deno.test("FreshApp - .delete()", async () => {
  const app = new FreshApp<{ text: string }>()
    .get("/", () => new Response("fail"))
    .get("/foo", () => new Response("fail"))
    .delete("/", () => new Response("ok"))
    .delete("/foo", () => new Response("ok"));

  const server = new FakeServer(app.handler());

  let res = await server.delete("/");
  expect(await res.text()).toEqual("ok");

  res = await server.delete("/foo");
  expect(await res.text()).toEqual("ok");
});

Deno.test("FreshApp - .delete() with basePath", async () => {
  const app = new FreshApp({ basePath: "/foo/bar" })
    .delete("/", () => new Response("ok"))
    .delete("/foo", () => new Response("ok"));

  const server = new FakeServer(app.handler());

  let res = await server.delete("/");
  expect(res.status).toEqual(404);
  res = await server.delete("/foo");
  expect(res.status).toEqual(404);

  res = await server.delete("/foo/bar");
  expect(res.status).toEqual(200);
  res = await server.delete("/foo/bar/foo");
  expect(res.status).toEqual(200);
});

Deno.test("FreshApp - wrong method match", async () => {
  const app = new FreshApp<{ text: string }>()
    .get("/", () => new Response("ok"))
    .post("/", () => new Response("ok"));

  const server = new FakeServer(app.handler());

  let res = await server.put("/");
  expect(res.status).toEqual(405);
  expect(await res.text()).toEqual("Method not allowed");

  res = await server.post("/");
  expect(res.status).toEqual(200);
  expect(await res.text()).toEqual("ok");
});

Deno.test("FreshApp - methods with middleware", async () => {
  const app = new FreshApp<{ text: string }>()
    .use((ctx) => {
      ctx.state.text = "A";
      return ctx.next();
    })
    .get("/", (ctx) => new Response(ctx.state.text))
    .post("/", (ctx) => new Response(ctx.state.text));

  const server = new FakeServer(app.handler());

  let res = await server.get("/");
  expect(await res.text()).toEqual("A");

  res = await server.post("/");
  expect(await res.text()).toEqual("A");
});

Deno.test.only("FreshApp - .route() compose apps", async () => {
  const innerApp = new FreshApp<{ text: string }>()
    .use((ctx) => {
      ctx.state.text = "A";
      return ctx.next();
    })
    .get("/", (ctx) => new Response(ctx.state.text))
    .post("/", (ctx) => new Response(ctx.state.text));

  const app = new FreshApp<{ text: string }>().route("/foo", innerApp);

  const server = new FakeServer(app.handler());

  let res = await server.get("/foo");
  expect(await res.text()).toEqual("A");

  res = await server.post("/foo");
  expect(await res.text()).toEqual("A");
});
