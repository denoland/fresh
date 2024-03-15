import { FreshApp } from "$fresh/server.ts";
import { FreshFsItem, fsRoutes } from "./fs_routes.ts";
import { FakeServer } from "../test_utils.ts";
import * as path from "jsr:@std/path";
import { createFakeFs } from "$fresh/src/_next/test_utils.ts";
import { expect } from "jsr:@std/expect";
import { HandlerFn, HandlerMethod } from "../defines.ts";
import { Method } from "../router.ts";

async function createServer<T>(
  files: Record<string, string | Uint8Array | FreshFsItem<T>>,
): Promise<FakeServer> {
  const app = new FreshApp<T>();

  await fsRoutes(app, {
    dir: ".",
    // deno-lint-ignore require-await
    load: async (filePath) => {
      const full = path.join("routes", filePath);
      if (full in files) {
        return files[full];
      }
      throw new Error(`Mock FS: file ${full} not found`);
    },
    _fs: createFakeFs(files),
  });
  return new FakeServer(app.handler());
}

Deno.test("fsRoutes - throws error when file has no exports", async () => {
  const p = createServer({ "routes/index.tsx": {} });
  await expect(p).rejects.toMatch(/relevant exports/);
});

Deno.test("fsRoutes - registers HTTP methods on router", async () => {
  const methodHandler: HandlerMethod<unknown, unknown> = {
    GET: () => new Response("GET"),
    POST: () => new Response("POST"),
    PATCH: () => new Response("PATCH"),
    PUT: () => new Response("PUT"),
    DELETE: () => new Response("DELETE"),
    HEAD: () => new Response("HEAD"),
  };
  const server = await createServer({
    "routes/all.ts": { handlers: methodHandler },
    "routes/get.ts": { handlers: { GET: methodHandler.GET } },
    "routes/post.ts": { handlers: { POST: methodHandler.POST } },
    "routes/patch.ts": { handlers: { PATCH: methodHandler.PATCH } },
    "routes/put.ts": { handlers: { PUT: methodHandler.PUT } },
    "routes/delete.ts": { handlers: { DELETE: methodHandler.DELETE } },
    "routes/head.ts": { handlers: { HEAD: methodHandler.HEAD } },
  });

  const methods: Method[] = ["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD"];
  for (const method of methods) {
    const name = method.toLowerCase() as Lowercase<Method>;
    const res = await server[name]("/all");
    expect(res.status).toEqual(200);
    expect(await res.text()).toEqual(method);
  }

  // Check individual routes
  for (const method of methods) {
    const lower = method.toLowerCase() as Lowercase<Method>;
    const res = await server[lower](`/${lower}`);
    expect(res.status).toEqual(200);
    expect(await res.text()).toEqual(method);

    // Check that all other methods are forbidden
    for (const other of methods) {
      if (other === method) continue;

      const name = other.toLowerCase() as Lowercase<Method>;
      const res = await server[name](`/${lower}`);
      await res.body?.cancel();
      expect(res.status).toEqual(405);
    }
  }
});

Deno.test("fsRoutes - registers fn handler for every method", async () => {
  const handler: HandlerFn<unknown, unknown> = () => new Response("ok");
  const server = await createServer({
    "routes/all.ts": { handlers: handler },
  });

  const methods: Method[] = ["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD"];
  for (const method of methods) {
    const name = method.toLowerCase() as Lowercase<Method>;
    const res = await server[name]("/all");
    expect(res.status).toEqual(200);
    expect(await res.text()).toEqual("ok");
  }

  // Check individual routes
  for (const method of methods) {
    const lower = method.toLowerCase() as Lowercase<Method>;
    const res = await server[lower]("/all");
    expect(res.status).toEqual(200);
    expect(await res.text()).toEqual("ok");
  }
});

Deno.test("fsRoutes - renders component without handler", async () => {
  const server = await createServer({
    "routes/all.ts": { default: () => <h1>foo</h1> },
  });

  const res = await server.get("/all");
  expect(res.status).toEqual(200);
  expect(res.headers.get("Content-Type")).toEqual("text/html; charset=utf-8");
  expect(await res.text()).toEqual("<h1>foo</h1>");
});

Deno.test("fsRoutes - sorts routes", async () => {
  const server = await createServer({
    "routes/[id].ts": { handler: () => new Response("fail") },
    "routes/all.ts": { handler: () => new Response("ok") },
  });

  const res = await server.get("/all");
  expect(await res.text()).toEqual("ok");
});

Deno.test("fsRoutes - serve index", async () => {
  const server = await createServer({
    "routes/[id].ts": { handler: () => new Response("fail") },
    "routes/index.ts": { handler: () => new Response("ok") },
  });

  const res = await server.get("/");
  expect(await res.text()).toEqual("ok");
});

Deno.test("fsRoutes - add middleware for function handler", async () => {
  const server = await createServer<{ text: string }>({
    "routes/[id].ts": { handler: (ctx) => new Response(ctx.state.text) },
    "routes/index.ts": { handler: (ctx) => new Response(ctx.state.text) },
    "routes/none.ts": { default: (ctx) => <>{ctx.state.text}</> },
    "routes/_middleware.ts": {
      handler(ctx) {
        ctx.state.text = "ok";
        return ctx.next();
      },
    },
  });

  let res = await server.get("/");
  expect(await res.text()).toEqual("ok");

  res = await server.get("/foo");
  expect(await res.text()).toEqual("ok");

  res = await server.get("/none");
  expect(await res.text()).toEqual("ok");
});

Deno.test("fsRoutes - nested middlewares", async () => {
  const server = await createServer<{ text: string }>({
    "routes/_middleware.ts": {
      handler: (ctx) => {
        ctx.state.text = "A";
        return ctx.next();
      },
    },
    "routes/foo/_middleware.ts": {
      handler: (ctx) => {
        ctx.state.text += "B";
        return ctx.next();
      },
    },
    "routes/foo/index.ts": { default: (ctx) => <>{ctx.state.text}</> },
  });

  const res = await server.get("/foo");
  expect(await res.text()).toEqual("AB");
});

Deno.test("fsRoutes - combined", async () => {
  const server = await createServer<{ text: string }>({
    "routes/foo/bar.ts": {
      handler: () => {},
      default: (ctx) => <>{ctx.state.text}</>,
    },
    "routes/foo/_middleware.ts": {
      handler: (ctx) => {
        ctx.state.text = "ok";
        return ctx.next();
      },
    },
    "routes/_middleware.ts": {
      handler: (ctx) => {
        ctx.state.text = "ok";
        return ctx.next();
      },
    },
  });

  const res = await server.get("/foo/bar");
  expect(await res.text()).toEqual("ok");
});

Deno.test("fsRoutes - prepend _app", async () => {
  const server = await createServer({
    "routes/foo/bar.ts": {
      default: () => <>foo_bar</>,
    },
    "routes/foo.ts": {
      default: () => <>foo</>,
    },
    "routes/_app.tsx": {
      default: (ctx) => (
        <>
          app/<ctx.Component />
        </>
      ),
    },
  });

  let res = await server.get("/foo/bar");
  expect(await res.text()).toEqual("app/foo_bar");

  res = await server.get("/foo");
  expect(await res.text()).toEqual("app/foo");
});

Deno.test.ignore("fsRoutes - prepend _layout", async () => {
  const server = await createServer({
    "routes/foo/bar.ts": {
      default: () => <>foo_bar</>,
    },
    "routes/foo.ts": {
      default: () => <>foo</>,
    },
    "routes/_layout.tsx": {
      default: (ctx) => (
        <>
          layout/<ctx.Component />
        </>
      ),
    },
    "routes/_app.tsx": {
      default: (ctx) => (
        <>
          app/<ctx.Component />
        </>
      ),
    },
  });

  let res = await server.get("/foo/bar");
  expect(await res.text()).toEqual("app/layout/foo_bar");

  res = await server.get("/foo");
  expect(await res.text()).toEqual("app/layout/foo");
});

Deno.test.ignore("fsRoutes - nested _layout", async () => {
  const server = await createServer({
    "routes/foo/bar.ts": {
      default: () => <>foo_bar</>,
    },
    "routes/foo.ts": {
      default: () => <>foo</>,
    },
    "routes/foo/_layout.tsx": {
      default: (ctx) => (
        <>
          layout_foo_bar/<ctx.Component />
        </>
      ),
    },
    "routes/_layout.tsx": {
      default: (ctx) => (
        <>
          layout/<ctx.Component />
        </>
      ),
    },
    "routes/_app.tsx": {
      default: (ctx) => (
        <>
          app/<ctx.Component />
        </>
      ),
    },
  });

  let res = await server.get("/foo/bar");
  expect(await res.text()).toEqual("app/layout/layout_foo_bar/foo_bar");

  res = await server.get("/foo");
  expect(await res.text()).toEqual("app/layout/foo");
});

Deno.test("fsRoutes - _layout skip if not present", async () => {
  const server = await createServer({
    "routes/foo/bar/baz.ts": {
      default: () => <>foo_bar_baz</>,
    },
    "routes/foo/_layout.tsx": {
      default: (ctx) => (
        <>
          layout_foo/<ctx.Component />
        </>
      ),
    },
  });

  const res = await server.get("/foo/bar/baz");
  expect(await res.text()).toEqual("layout_foo/foo_bar_baz");
});

Deno.test("fsRoutes - _layout file types", async () => {
  const server = await createServer({
    "routes/js/index.js": {
      default: () => <>js</>,
    },
    "routes/js/_layout.js": {
      default: (ctx) => (
        <>
          layout_js/<ctx.Component />
        </>
      ),
    },
    "routes/jsx/index.jsx": {
      default: () => <>jsx</>,
    },
    "routes/jsx/_layout.jsx": {
      default: (ctx) => (
        <>
          layout_jsx/<ctx.Component />
        </>
      ),
    },
    "routes/ts/index.ts": {
      default: () => <>ts</>,
    },
    "routes/ts/_layout.tsx": {
      default: (ctx) => (
        <>
          layout_ts/<ctx.Component />
        </>
      ),
    },
    "routes/tsx/index.tsx": {
      default: () => <>tsx</>,
    },
    "routes/tsx/_layout.tsx": {
      default: (ctx) => (
        <>
          layout_tsx/<ctx.Component />
        </>
      ),
    },
  });

  const res = await server.get("/js");
  expect(await res.text()).toEqual("layout_js/js");
});

Deno.test.ignore("fsRoutes - _layout disable _app", async () => {
  const server = await createServer({
    "routes/index.tsx": {
      default: () => <>route</>,
    },
    "routes/_layout.tsx": {
      config: {
        skipAppWrapper: true,
      },
      default: (ctx) => (
        <>
          layout/<ctx.Component />
        </>
      ),
    },
    "routes/_app.tsx": {
      default: (ctx) => (
        <>
          app/<ctx.Component />
        </>
      ),
    },
  });

  const res = await server.get("/");
  expect(await res.text()).toEqual("layout/route");
});

Deno.test.ignore(
  "fsRoutes - _layout disable _app + inherited _layouts",
  async () => {
    const server = await createServer({
      "routes/sub/sub2/index.tsx": {
        default: () => <>sub_sub2</>,
      },
      "routes/sub/sub2/_layout.tsx": {
        default: (ctx) => (
          <>
            layout_sub_sub2/<ctx.Component />
          </>
        ),
      },
      "routes/sub/_layout.tsx": {
        config: {
          skipAppWrapper: true,
          skipInheritedLayouts: true,
        },
        default: (ctx) => (
          <>
            layout_sub/<ctx.Component />
          </>
        ),
      },
      "routes/_layout.tsx": {
        default: (ctx) => (
          <>
            layout/<ctx.Component />
          </>
        ),
      },
      "routes/_app.tsx": {
        default: (ctx) => (
          <>
            app/<ctx.Component />
          </>
        ),
      },
    });

    const res = await server.get("/sub/sub2");
    expect(await res.text()).toEqual("layout_sub/layout_sub_sub2/sub_sub2");
  },
);

Deno.test.ignore("fsRoutes - route overrides _layout", async () => {
  const server = await createServer({
    "routes/index.tsx": {
      config: {
        skipInheritedLayouts: true,
      },
      default: () => <>route</>,
    },
    "routes/_layout.tsx": {
      default: (ctx) => (
        <>
          layout/<ctx.Component />
        </>
      ),
    },
  });

  const res = await server.get("/");
  expect(await res.text()).toEqual("route");
});

Deno.test.ignore("fsRoutes - route overrides _app", async () => {
  const server = await createServer({
    "routes/index.tsx": {
      config: {
        skipAppWrapper: true,
      },
      default: () => <>route</>,
    },
    "routes/_app.tsx": {
      default: (ctx) => (
        <>
          app/<ctx.Component />
        </>
      ),
    },
  });

  const res = await server.get("/");
  expect(await res.text()).toEqual("route");
});
