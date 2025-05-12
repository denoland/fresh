import { expect } from "@std/expect";
import { App, getIslandRegistry, setBuildCache } from "./app.ts";
import { FakeServer } from "./test_utils.ts";
import { ProdBuildCache } from "./build_cache.ts";

Deno.test("FreshApp - .use()", async () => {
  const app = new App<{ text: string }>()
    .use((ctx) => {
      ctx.state.text = "A";
      return ctx.next();
    })
    .use((ctx) => {
      ctx.state.text += "B";
      return ctx.next();
    })
    .get("/", (ctx) => new Response(ctx.state.text));

  const server = new FakeServer(app.handler());

  const res = await server.get("/");
  expect(await res.text()).toEqual("AB");
});

Deno.test("FreshApp - .use() #2", async () => {
  const app = new App<{ text: string }>()
    .use(() => new Response("ok #1"))
    .get("/foo/bar", () => new Response("ok #2"))
    .get("/", () => new Response("ok #3"));

  const server = new FakeServer(app.handler());

  const res = await server.get("/");
  expect(await res.text()).toEqual("ok #1");
});

Deno.test("FreshApp - .get()", async () => {
  const app = new App()
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
  const app = new App({ basePath: "/foo/bar" })
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
  const app = new App<{ text: string }>()
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
  const app = new App({ basePath: "/foo/bar" })
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
  const app = new App<{ text: string }>()
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
  const app = new App({ basePath: "/foo/bar" })
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
  const app = new App<{ text: string }>()
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
  const app = new App({ basePath: "/foo/bar" })
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
  const app = new App<{ text: string }>()
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
  const app = new App({ basePath: "/foo/bar" })
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
  const app = new App<{ text: string }>()
    .get("/", () => new Response("ok"))
    .post("/", () => new Response("ok"));

  const server = new FakeServer(app.handler());

  let res = await server.put("/");
  expect(res.status).toEqual(405);
  expect(await res.text()).toEqual("Method Not Allowed");

  res = await server.post("/");
  expect(res.status).toEqual(200);
  expect(await res.text()).toEqual("ok");
});

Deno.test("FreshApp - methods with middleware", async () => {
  const app = new App<{ text: string }>()
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

Deno.test("FreshApp - .mountApp() compose apps", async () => {
  const innerApp = new App<{ text: string }>()
    .use((ctx) => {
      ctx.state.text = "A";
      return ctx.next();
    })
    .get("/", (ctx) => new Response(ctx.state.text))
    .post("/", (ctx) => new Response(ctx.state.text));

  const app = new App<{ text: string }>()
    .get("/", () => new Response("ok"))
    .mountApp("/foo", innerApp);

  const server = new FakeServer(app.handler());

  let res = await server.get("/");
  expect(await res.text()).toEqual("ok");

  res = await server.get("/foo");
  expect(await res.text()).toEqual("A");

  res = await server.post("/foo");
  expect(await res.text()).toEqual("A");
});

Deno.test("FreshApp - .mountApp() self mount, no middleware", async () => {
  const innerApp = new App<{ text: string }>()
    .use((ctx) => {
      ctx.state.text = "A";
      return ctx.next();
    })
    .get("/foo", (ctx) => new Response(ctx.state.text))
    .post("/foo", (ctx) => new Response(ctx.state.text));

  const app = new App<{ text: string }>()
    .get("/", () => new Response("ok"))
    .mountApp("/", innerApp);

  const server = new FakeServer(app.handler());

  let res = await server.get("/");
  expect(await res.text()).toEqual("ok");

  res = await server.get("/foo");
  expect(await res.text()).toEqual("A");

  res = await server.post("/foo");
  expect(await res.text()).toEqual("A");
});

Deno.test(
  "FreshApp - .mountApp() self mount, with middleware",
  async () => {
    const innerApp = new App<{ text: string }>()
      .use(function B(ctx) {
        ctx.state.text += "B";
        return ctx.next();
      })
      .get("/foo", (ctx) => new Response(ctx.state.text))
      .post("/foo", (ctx) => new Response(ctx.state.text));

    const app = new App<{ text: string }>()
      .use(function A(ctx) {
        ctx.state.text = "A";
        return ctx.next();
      })
      .get("/", () => new Response("ok"))
      .mountApp("/", innerApp);

    const server = new FakeServer(app.handler());

    let res = await server.get("/");
    expect(await res.text()).toEqual("ok");

    res = await server.get("/foo");
    expect(await res.text()).toEqual("AB");

    res = await server.post("/foo");
    expect(await res.text()).toEqual("AB");
  },
);

Deno.test(
  "FreshApp - .mountApp() self mount, different order",
  async () => {
    const innerApp = new App<{ text: string }>()
      .get("/foo", (ctx) => new Response(ctx.state.text))
      .use(function B(ctx) {
        ctx.state.text += "B";
        return ctx.next();
      })
      .post("/foo", (ctx) => new Response(ctx.state.text));

    const app = new App<{ text: string }>()
      .use(function A(ctx) {
        ctx.state.text = "A";
        return ctx.next();
      })
      .get("/", () => new Response("ok"))
      .mountApp("/", innerApp);

    const server = new FakeServer(app.handler());

    let res = await server.get("/");
    expect(await res.text()).toEqual("ok");

    res = await server.get("/foo");
    expect(await res.text()).toEqual("AB");

    res = await server.post("/foo");
    expect(await res.text()).toEqual("AB");
  },
);

Deno.test("FreshApp - .mountApp() self mount empty", async () => {
  const innerApp = new App<{ text: string }>()
    .use((ctx) => {
      ctx.state.text = "A";
      return ctx.next();
    })
    .get("/foo", (ctx) => new Response(ctx.state.text));

  const app = new App<{ text: string }>()
    .mountApp("/", innerApp);

  const server = new FakeServer(app.handler());

  const res = await server.get("/foo");
  expect(await res.text()).toEqual("A");
});

Deno.test(
  "FreshApp - .mountApp() self mount with middleware",
  async () => {
    const innerApp = new App<{ text: string }>()
      .use(function Inner(ctx) {
        ctx.state.text += "_Inner";
        return ctx.next();
      })
      .get("/", (ctx) => new Response(ctx.state.text));

    const app = new App<{ text: string }>()
      .use(function Outer(ctx) {
        ctx.state.text = "Outer";
        return ctx.next();
      })
      .mountApp("/", innerApp);

    const server = new FakeServer(app.handler());

    const res = await server.get("/");
    expect(await res.text()).toEqual("Outer_Inner");
  },
);

Deno.test("FreshApp - catches errors", async () => {
  let thrownErr: unknown | null = null;
  const app = new App<{ text: string }>()
    .use(async (ctx) => {
      ctx.state.text = "A";
      try {
        return await ctx.next();
      } catch (err) {
        thrownErr = err;
        throw err;
      }
    })
    .get("/", () => {
      throw new Error("fail");
    });

  const server = new FakeServer(app.handler());

  const res = await server.get("/");
  expect(res.status).toEqual(500);
  expect(thrownErr).toBeInstanceOf(Error);
});

// TODO: Find a better way to test this
Deno.test.ignore("FreshApp - finish setup", async () => {
  const app = new App<{ text: string }>()
    .get("/", (ctx) => {
      return ctx.render(<div>ok</div>);
    });

  setBuildCache(
    app,
    ProdBuildCache.fromSnapshot({
      ...app.config,
      build: {
        outDir: "foo",
      },
    }, getIslandRegistry(app).size),
  );

  const server = new FakeServer(app.handler());
  const res = await server.get("/");
  const text = await res.text();
  expect(text).toContain("Finish setting up");
  expect(res.status).toEqual(500);
});

Deno.test("FreshApp - sets error on context", async () => {
  const thrown: [unknown, unknown][] = [];
  const app = new App()
    .use(async (ctx) => {
      try {
        return await ctx.next();
      } catch (err) {
        thrown.push([err, ctx.error]);
        throw err;
      }
    })
    .use(async (ctx) => {
      try {
        return await ctx.next();
      } catch (err) {
        thrown.push([err, ctx.error]);
        throw err;
      }
    })
    .get("/", () => {
      throw "<mock error>";
    });

  const server = new FakeServer(app.handler());

  const res = await server.get("/");
  await res.body?.cancel();
  expect(thrown.length).toEqual(2);
  expect(thrown[0][0]).toEqual(thrown[0][1]);
  expect(thrown[1][0]).toEqual(thrown[1][1]);
});

Deno.test("FreshApp - support setting request init in ctx.render()", async () => {
  const app = new App<{ text: string }>()
    .get("/", (ctx) => {
      return ctx.render(<div>ok</div>, {
        status: 416,
        headers: { "X-Foo": "foo" },
      });
    });

  const server = new FakeServer(app.handler());
  const res = await server.get("/");
  await res.body?.cancel();
  expect(res.status).toEqual(416);
  expect(res.headers.get("X-Foo")).toEqual("foo");
});
