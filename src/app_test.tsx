import { expect } from "@std/expect";
import { App } from "./app.ts";
import { FakeServer } from "./test_utils.ts";
import { HttpError } from "./error.ts";

Deno.test("App - .use()", async () => {
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

Deno.test("App - .use() #2", async () => {
  const app = new App<{ text: string }>()
    .use(() => new Response("ok #1"))
    .get("/foo/bar", () => new Response("ok #2"))
    .get("/", () => new Response("ok #3"));

  const server = new FakeServer(app.handler());

  const res = await server.get("/");
  expect(await res.text()).toEqual("ok #1");
});

Deno.test("App - .get()", async () => {
  const app = new App()
    .get("/", () => new Response("ok"))
    .get("/foo", () => new Response("ok"));

  const server = new FakeServer(app.handler());

  let res = await server.get("/");
  expect(await res.text()).toEqual("ok");

  res = await server.get("/foo");
  expect(await res.text()).toEqual("ok");
});

Deno.test("App - .get() with basePath", async () => {
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

Deno.test("App - .post()", async () => {
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

Deno.test("App - .post() with basePath", async () => {
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

Deno.test("App - .patch()", async () => {
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

Deno.test("App - .patch() with basePath", async () => {
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

Deno.test("App - .put()", async () => {
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

Deno.test("App - .put() with basePath", async () => {
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

Deno.test("App - .delete()", async () => {
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

Deno.test("App - .delete() with basePath", async () => {
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

Deno.test("App - wrong method match", async () => {
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

Deno.test("App - methods with middleware", async () => {
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

Deno.test("App - .mountApp() compose apps", async () => {
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

Deno.test("App - .mountApp() compose apps with .route()", async () => {
  const innerApp = new App<{ text: string }>()
    .use((ctx) => {
      ctx.state.text = "A";
      return ctx.next();
    })
    .route("/", { handler: (ctx) => new Response(ctx.state.text) });

  const app = new App<{ text: string }>()
    .get("/", () => new Response("ok"))
    .mountApp("/foo", innerApp);

  const server = new FakeServer(app.handler());

  let res = await server.get("/");
  expect(await res.text()).toEqual("ok");

  res = await server.get("/foo");
  expect(await res.text()).toEqual("A");
});

Deno.test("App - .mountApp() self mount, no middleware", async () => {
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
  "App - .mountApp() self mount, with middleware",
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
  "App - .mountApp() self mount, different order",
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

Deno.test("App - .mountApp() self mount empty", async () => {
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
  "App - .mountApp() self mount with middleware",
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

// https://github.com/denoland/fresh/issues/3033
Deno.test(
  "App - .mountApp() self mount with dynamic routes",
  async () => {
    const innerApp = new App<{ text: string }>()
      .get("/", () => new Response("list authors"))
      .get("/:name", (ctx) => new Response(`show: ${ctx.params.name}`));

    const app = new App<{ text: string }>()
      .mountApp("/api/authors", innerApp);

    const server = new FakeServer(app.handler());

    let res = await server.get("/api/authors");
    expect(await res.text()).toEqual("list authors");

    res = await server.get("/api/authors/foo");
    expect(await res.text()).toEqual("show: foo");
  },
);

Deno.test("App - .mountApp() fallback route", async () => {
  let called = "";
  const innerApp = new App<{ text: string }>()
    .use(function Inner(ctx) {
      called += "_Inner";
      return ctx.next();
    })
    .get("/", (ctx) => new Response(ctx.state.text));

  const app = new App<{ text: string }>()
    .use(function Outer(ctx) {
      called += "Outer";
      return ctx.next();
    })
    .mountApp("/", innerApp);

  const server = new FakeServer(app.handler());

  const res = await server.get("/invalid");
  await res.body?.cancel();
  expect(called).toEqual("Outer_Inner");
});

Deno.test("App - catches errors", async () => {
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

Deno.test("App - sets error on context", async () => {
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

Deno.test("App - support setting request init in ctx.render()", async () => {
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

Deno.test("App - throw when middleware returns no response", async () => {
  const app = new App<{ text: string }>()
    .get(
      "/",
      // deno-lint-ignore no-explicit-any
      (() => {}) as any,
    );

  const server = new FakeServer(app.handler());
  const res = await server.get("/");
  const text = await res.text();
  expect(res.status).toEqual(500);
  expect(text).toContain("Internal server error");
});

Deno.test("App - overwrite default 404 handler", async () => {
  const app = new App()
    .notFound(() => new Response("bar", { status: 404 }))
    .get("/foo", () => new Response("foo"))
    .get("/thrower", () => {
      throw new HttpError(404);
    });

  const server = new FakeServer(app.handler());

  let res = await server.get("/invalid");
  expect(await res.text()).toEqual("bar");

  res = await server.get("/thrower");
  expect(await res.text()).toEqual("bar");
});

Deno.test("App - uses error route", async () => {
  const app = new App()
    .onError("*", () => new Response("error route", { status: 200 }))
    .get("/thrower", () => {
      throw new HttpError(404);
    });

  const server = new FakeServer(app.handler());

  let res = await server.get("/invalid");
  expect(await res.text()).toEqual("error route");

  res = await server.get("/thrower");
  expect(await res.text()).toEqual("error route");
});

Deno.test("App - uses notFound route on 404", async () => {
  const app = new App()
    .notFound(() => new Response("not found route", { status: 404 }))
    .onError("*", () => new Response("error route", { status: 500 }))
    .get("/thrower", () => {
      throw new HttpError(404);
    })
    .get("/thrower_2", () => {
      throw new HttpError(500);
    });

  const server = new FakeServer(app.handler());

  let res = await server.get("/invalid");
  expect(await res.text()).toEqual("not found route");

  res = await server.get("/thrower");
  expect(await res.text()).toEqual("not found route");

  res = await server.get("/thrower_2");
  expect(await res.text()).toEqual("error route");
});

// Issue: https://github.com/denoland/fresh/issues/3115
Deno.test("App - .route() with basePath", async () => {
  const app = new App({ basePath: "/foo/bar" })
    .route("/", { handler: () => new Response("ok") });

  const server = new FakeServer(app.handler());

  let res = await server.delete("/");
  await res.body?.cancel();
  expect(res.status).toEqual(404);

  res = await server.delete("/foo");
  await res.body?.cancel();
  expect(res.status).toEqual(404);

  res = await server.delete("/foo/bar");
  expect(await res.text()).toEqual("ok");
  expect(res.status).toEqual(200);
});

Deno.test("App - .use() - lazy", async () => {
  const app = new App<{ text: string }>()
    // deno-lint-ignore require-await
    .use(async () => {
      return (ctx) => {
        ctx.state.text = "ok";
        return ctx.next();
      };
    })
    .get("/", (ctx) => new Response(ctx.state.text));

  const server = new FakeServer(app.handler());

  const res = await server.get("/");
  expect(await res.text()).toEqual("ok");
});

Deno.test("App - .route() - lazy", async () => {
  const app = new App()
    // deno-lint-ignore require-await
    .route("/", async () => {
      return { handler: () => new Response("ok") };
    });

  const server = new FakeServer(app.handler());

  const res = await server.get("/");
  expect(await res.text()).toEqual("ok");
});

Deno.test("App - .get/post/patch/put/delete/head/all() - lazy", async () => {
  const app = new App()
    .get("/", () => Promise.resolve(() => new Response("ok")))
    .post("/", () => Promise.resolve(() => new Response("ok")))
    .patch("/", () => Promise.resolve(() => new Response("ok")))
    .delete("/", () => Promise.resolve(() => new Response("ok")))
    .put("/", () => Promise.resolve(() => new Response("ok")))
    .head("/", () => Promise.resolve(() => new Response("ok")))
    .all("/", () => Promise.resolve(() => new Response("ok")));

  const server = new FakeServer(app.handler());

  let res = await server.get("/");
  expect(await res.text()).toEqual("ok");

  res = await server.post("/");
  expect(await res.text()).toEqual("ok");

  res = await server.put("/");
  expect(await res.text()).toEqual("ok");

  res = await server.patch("/");
  expect(await res.text()).toEqual("ok");

  res = await server.delete("/");
  expect(await res.text()).toEqual("ok");

  res = await server.head("/");
  expect(await res.text()).toEqual("ok");
});
