import { App } from "../../app.ts";
import {
  type FreshFsItem,
  fsRoutes,
  type FsRoutesOptions,
  sortRoutePaths,
  type TESTING_ONLY__FsRoutesOptions,
} from "./mod.ts";
import { delay, FakeServer } from "../../test_utils.ts";
import { createFakeFs } from "../../test_utils.ts";
import { expect } from "@std/expect";
import { type HandlerByMethod, type HandlerFn, page } from "../../handlers.ts";
import type { Method } from "../../router.ts";
import { parseHtml } from "../../../tests/test_utils.tsx";
import type { FreshContext } from "fresh";

async function createServer<T>(
  files: Record<string, string | Uint8Array | FreshFsItem<T>>,
): Promise<FakeServer> {
  const app = new App<T>();

  await fsRoutes(
    app,
    {
      dir: ".",
      loadIsland: async () => {},
      // deno-lint-ignore require-await
      loadRoute: async (filePath) => {
        const full = `routes/${filePath.replaceAll(/[\\]+/g, "/")}`;
        if (full in files) {
          return files[full];
        }
        throw new Error(`Mock FS: file ${full} not found`);
      },
      _fs: createFakeFs(files),
    } as FsRoutesOptions & TESTING_ONLY__FsRoutesOptions,
  );
  return new FakeServer(await app.handler());
}

Deno.test("fsRoutes - throws error when file has no exports", async () => {
  const p = createServer({ "routes/index.tsx": {} });
  await expect(p).rejects.toMatch(/relevant exports/);
});

Deno.test("fsRoutes - registers HTTP methods on router", async () => {
  const methodHandler: HandlerByMethod<unknown, unknown> = {
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

  const doc = parseHtml(await res.text());
  // deno-lint-ignore no-explicit-any
  expect((doc.body.firstChild as any).outerHTML).toEqual(
    "<h1>foo</h1>",
  );
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
    "routes/none.ts": { default: (ctx) => <div>{ctx.state.text}</div> },
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
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("ok");
});

Deno.test("fsRoutes - middleware", async () => {
  const server = await createServer<{ text: string }>({
    "routes/index.ts": { handler: (ctx) => new Response(ctx.state.text) },
    "routes/_middleware.ts": {
      default: (ctx: FreshContext<{ text: string }>) => {
        ctx.state.text = "ok";
        return ctx.next();
      },
    },
  });

  const res = await server.get("/");
  expect(res.status).toEqual(200);
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
    "routes/foo/index.ts": { default: (ctx) => <div>{ctx.state.text}</div> },
  });

  const res = await server.get("/foo");
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("AB");
});

Deno.test("fsRoutes - middleware array", async () => {
  const server = await createServer<{ text: string }>({
    "routes/_middleware.ts": {
      handler: [
        (ctx) => {
          ctx.state.text = "A";
          return ctx.next();
        },
        (ctx) => {
          ctx.state.text += "B";
          return ctx.next();
        },
      ],
    },
    "routes/foo/_middleware.ts": {
      handler: (ctx) => {
        ctx.state.text += "C";
        return ctx.next();
      },
    },
    "routes/foo/index.ts": { default: (ctx) => <div>{ctx.state.text}</div> },
  });

  const res = await server.get("/foo");
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("ABC");
});

Deno.test("fsRoutes - combined", async () => {
  const server = await createServer<{ text: string }>({
    "routes/foo/bar.ts": {
      default: (ctx) => <div>{ctx.state.text}</div>,
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
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("ok");
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
        <div>
          app/<ctx.Component />
        </div>
      ),
    },
  });

  let res = await server.get("/foo/bar");
  let doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("app/foo_bar");

  res = await server.get("/foo");
  doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("app/foo");
});

Deno.test("fsRoutes - prepend _layout", async () => {
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
        <div>
          app/<ctx.Component />
        </div>
      ),
    },
  });

  let res = await server.get("/foo/bar");
  let doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("app/layout/foo_bar");

  res = await server.get("/foo");
  doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("app/layout/foo");
});

Deno.test("fsRoutes - nested _layout", async () => {
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
        <div>
          app/<ctx.Component />
        </div>
      ),
    },
  });

  let res = await server.get("/foo/bar");
  let doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual(
    "app/layout/layout_foo_bar/foo_bar",
  );

  res = await server.get("/foo");
  doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("app/layout/foo");
});

Deno.test("fsRoutes - _layout skip if not present", async () => {
  const server = await createServer({
    "routes/foo/bar/baz.ts": {
      default: () => <>foo_bar_baz</>,
    },
    "routes/foo/_layout.tsx": {
      default: (ctx) => (
        <div>
          layout_foo/<ctx.Component />
        </div>
      ),
    },
  });

  const res = await server.get("/foo/bar/baz");
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("layout_foo/foo_bar_baz");
});

Deno.test("fsRoutes - _layout file types", async () => {
  const server = await createServer({
    "routes/js/index.js": {
      default: () => <>js</>,
    },
    "routes/js/_layout.js": {
      default: (ctx) => (
        <div>
          layout_js/<ctx.Component />
        </div>
      ),
    },
    "routes/jsx/index.jsx": {
      default: () => <>jsx</>,
    },
    "routes/jsx/_layout.jsx": {
      default: (ctx) => (
        <div>
          layout_jsx/<ctx.Component />
        </div>
      ),
    },
    "routes/ts/index.ts": {
      default: () => <>ts</>,
    },
    "routes/ts/_layout.tsx": {
      default: (ctx) => (
        <div>
          layout_ts/<ctx.Component />
        </div>
      ),
    },
    "routes/tsx/index.tsx": {
      default: () => <>tsx</>,
    },
    "routes/tsx/_layout.tsx": {
      default: (ctx) => (
        <div>
          layout_tsx/<ctx.Component />
        </div>
      ),
    },
  });

  const res = await server.get("/js");
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("layout_js/js");
});

Deno.test("fsRoutes - _layout disable _app", async () => {
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
        <div>
          app/<ctx.Component />
        </div>
      ),
    },
  });

  const res = await server.get("/");
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("layout/route");
});

Deno.test(
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
          <div>
            app/<ctx.Component />
          </div>
        ),
      },
    });

    const res = await server.get("/sub/sub2");
    const doc = parseHtml(await res.text());
    expect(doc.body.firstChild?.textContent).toEqual(
      "layout_sub/layout_sub_sub2/sub_sub2",
    );
  },
);

Deno.test("fsRoutes - route overrides _layout", async () => {
  const server = await createServer({
    "routes/index.tsx": {
      config: {
        skipInheritedLayouts: true,
      },
      default: () => <>route</>,
    },
    "routes/_layout.tsx": {
      default: (ctx) => (
        <div>
          layout/<ctx.Component />
        </div>
      ),
    },
  });

  const res = await server.get("/");
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("route");
});

Deno.test("fsRoutes - route overrides _app", async () => {
  const server = await createServer({
    "routes/index.tsx": {
      config: {
        skipAppWrapper: true,
      },
      default: () => <>route</>,
    },
    "routes/_app.tsx": {
      default: (ctx) => (
        <div>
          app/<ctx.Component />
        </div>
      ),
    },
    // Add some more routes on same level
    "routes/a.tsx": { default: () => <>a</> },
    "routes/b.tsx": { default: () => <>b</> },
    "routes/c.tsx": { default: () => <>c</> },
  });

  const res = await server.get("/");
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("route");
});

Deno.test("fsRoutes - handler return data", async () => {
  const server = await createServer({
    "routes/index.tsx": {
      handler: () => {
        return page("foo", { status: 404 });
      },
      default: (ctx) => {
        // deno-lint-ignore no-explicit-any
        return <p>{ctx.data as any}</p>;
      },
    },
  });

  const res = await server.get("/");
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("foo");
});

Deno.test("fsRoutes - _404", async () => {
  const server = await createServer({
    "routes/_404.tsx": {
      default: () => {
        return <div>Custom 404 - Not Found</div>;
      },
    },
    "routes/index.tsx": {
      handlers: () => {
        throw new Error("ok");
      },
    },
  });

  const res = await server.get("/invalid");
  const content = await res.text();
  expect(content).toContain("Custom 404 - Not Found");
});

Deno.test("fsRoutes - _500", async () => {
  const server = await createServer({
    "routes/_500.tsx": {
      default: () => {
        return <div>Custom Error Page</div>;
      },
    },
    "routes/index.tsx": {
      handlers: () => {
        throw new Error("ok");
      },
    },
  });

  const res = await server.get("/");
  const content = await res.text();
  expect(content).toContain("Custom Error Page");
});

Deno.test("fsRoutes - _error", async () => {
  const server = await createServer({
    "routes/_error.tsx": {
      default: () => {
        return <div>Custom Error Page</div>;
      },
    },
    "routes/index.tsx": {
      handlers: () => {
        throw new Error("ok");
      },
    },
  });

  const res = await server.get("/");
  const content = await res.text();
  expect(content).toContain("Custom Error Page");
});

Deno.test("fsRoutes - _error nested", async () => {
  const server = await createServer({
    "routes/_error.tsx": {
      handlers: () => {
        throw new Error("fail");
      },
    },
    "routes/foo/_error.tsx": {
      handlers: (ctx) => {
        return new Response((ctx.error as Error).message);
      },
    },
    "routes/foo/index.tsx": {
      handlers: () => {
        throw new Error("ok");
      },
    },
  });

  const res = await server.get("/foo");
  expect(await res.text()).toEqual("ok");
});

Deno.test("fsRoutes - _error nested throw", async () => {
  const server = await createServer({
    "routes/_error.tsx": {
      handlers: (ctx) => {
        return new Response((ctx.error as Error).message);
      },
    },
    "routes/foo/_error.tsx": {
      handlers: () => {
        throw new Error("ok");
      },
    },
    "routes/foo/index.tsx": {
      handlers: () => {
        throw new Error("ok");
      },
    },
  });

  const res = await server.get("/foo");
  expect(await res.text()).toEqual("ok");
});

Deno.test("fsRoutes - _error render component", async () => {
  const server = await createServer({
    "routes/_error.tsx": {
      default: (ctx) => {
        return <div>{(ctx.error as Error).message}</div>;
      },
    },
    "routes/foo/_error.tsx": {
      handlers: () => {
        throw new Error("ok");
      },
    },
    "routes/foo/index.tsx": {
      handlers: () => {
        throw new Error("ok");
      },
    },
  });

  const res = await server.get("/foo");
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("ok");
});

Deno.test("fsRoutes - _error render on 404", async () => {
  // deno-lint-ignore no-explicit-any
  let error: any = null;
  const server = await createServer({
    "routes/_error.tsx": {
      default: (ctx) => {
        // deno-lint-ignore no-explicit-any
        error = ctx.error as any;
        return <p>ok</p>;
      },
    },
    "routes/foo/_error.tsx": {
      default: (ctx) => {
        // deno-lint-ignore no-explicit-any
        error = ctx.error as any;
        return <p>ok foo</p>;
      },
    },
    "routes/foo/index.tsx": {
      default: () => {
        return <p>ignore</p>;
      },
    },
  });

  let res = await server.get("/foo/a");
  let doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("ok foo");
  expect(error?.status).toEqual(404);

  res = await server.get("/");
  doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("ok");
  expect(error?.status).toEqual(404);
});

Deno.test("fsRoutes - skip _error component in non-error", async () => {
  const server = await createServer({
    "routes/_error.tsx": {
      default: function errorComp() {
        return <div>fail</div>;
      },
    },
    "routes/index.tsx": {
      default: () => <div>ok</div>,
    },
  });

  const res = await server.get("/");
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("ok");
});

Deno.test("fsRoutes - route group resolve index", async () => {
  const server = await createServer<{ text: string }>({
    "routes/(foo)/_layout.tsx": {
      default: (ctx) => (
        <div>
          layout/<ctx.Component />
        </div>
      ),
    },
    "routes/(foo)/index.tsx": {
      default: () => <>ok</>,
    },
  });

  const res = await server.get("/");
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("layout/ok");
});

Deno.test("fsRoutes - route group ignores (_...) folders", async () => {
  const server = await createServer<{ text: string }>({
    "routes/(_foo)/index.tsx": {
      default: () => <div>fail</div>,
    },
    "routes/(foo)/index.tsx": {
      default: () => <div>ok</div>,
    },
  });

  const res = await server.get("/");
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("ok");
});

Deno.test("fsRoutes - route group specific templates", async () => {
  const server = await createServer<{ text: string }>({
    "routes/(foo)/_error.tsx": {
      default: () => <div>fail foo</div>,
    },
    "routes/(foo)/_layout.tsx": {
      default: (ctx) => (
        <div>
          {ctx.state.text}/(foo)_layout/<ctx.Component />
        </div>
      ),
    },
    "routes/(foo)/_middleware.tsx": {
      handlers: (ctx) => {
        ctx.state.text = "(foo)_middleware";
        return ctx.next();
      },
    },
    "routes/(foo)/foo.tsx": {
      default: () => <div>foo</div>,
    },
    "routes/(foo)/foo_error.tsx": {
      default: () => {
        throw new Error("fail");
      },
    },
    "routes/(bar)/_error.tsx": {
      default: () => <div>fail bar</div>,
    },
    "routes/(bar)/_layout.tsx": {
      default: (ctx) => (
        <div>
          {ctx.state.text}/(bar)_layout/<ctx.Component />
        </div>
      ),
    },
    "routes/(bar)/_middleware.tsx": {
      handlers: (ctx) => {
        ctx.state.text = "(bar)_middleware";
        return ctx.next();
      },
    },
    "routes/(bar)/bar.tsx": {
      default: () => <div>bar</div>,
    },
    "routes/(bar)/bar_error.tsx": {
      default: () => {
        throw new Error("fail");
      },
    },
  });

  let res = await server.get("/foo");
  let doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual(
    "(foo)_middleware/(foo)_layout/foo",
  );
  res = await server.get("/foo_error");
  doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual(
    "(foo)_middleware/(foo)_layout/fail foo",
  );

  res = await server.get("/bar");
  doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual(
    "(bar)_middleware/(bar)_layout/bar",
  );

  res = await server.get("/bar_error");
  doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual(
    "(bar)_middleware/(bar)_layout/fail bar",
  );
});

Deno.test("fsRoutes - async route components", async () => {
  const server = await createServer<{ text: string }>({
    "routes/_error.tsx": {
      default: async () => {
        await delay(1);
        return <div>fail foo</div>;
      },
    },
    "routes/_layout.tsx": {
      default: async (ctx) => {
        await delay(1);
        return (
          <div>
            {ctx.state.text}/_layout/<ctx.Component />
          </div>
        );
      },
    },
    "routes/foo.tsx": {
      default: async () => {
        await delay(1);
        return <div>foo</div>;
      },
    },
    "routes/foo_error.tsx": {
      default: async () => {
        await delay(1);
        throw new Error("fail");
      },
    },
  });

  let res = await server.get("/foo");
  let doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("/_layout/foo");

  res = await server.get("/foo_error");
  doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("/_layout/fail foo");
});

Deno.test("fsRoutes - async route components returning response", async () => {
  const server = await createServer<{ text: string }>({
    "routes/_app.tsx": {
      default: async (ctx) => {
        await delay(1);
        if (ctx.url.searchParams.has("app")) {
          return new Response("_app");
        }
        return (
          <div>
            _app/<ctx.Component />
          </div>
        );
      },
    },
    "routes/_layout.tsx": {
      default: async (ctx) => {
        await delay(1);
        if (ctx.url.searchParams.has("layout")) {
          return new Response("_layout");
        }
        return (
          <div>
            _layout/<ctx.Component />
          </div>
        );
      },
    },
    "routes/index.tsx": {
      default: async (ctx) => {
        await delay(1);
        if (ctx.url.searchParams.has("index")) {
          return new Response("index");
        }
        return <div>index</div>;
      },
    },
  });

  let res = await server.get("/");
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("_app/_layout/index");

  res = await server.get("/?app");
  let text = await res.text();
  expect(text).toEqual("_app");

  res = await server.get("/?layout");
  text = await res.text();
  expect(text).toEqual("_layout");

  res = await server.get("/?index");
  text = await res.text();
  expect(text).toEqual("index");
});

Deno.test(
  "fsRoutes - returns response code from error route",
  async () => {
    const server = await createServer<{ text: string }>({
      "routes/_app.tsx": {
        default: (ctx) => {
          return (
            <div>
              _app/<ctx.Component />
            </div>
          );
        },
      },
      "routes/_error.tsx": {
        default: () => <div>fail</div>,
      },
      "routes/index.tsx": {
        default: () => <div>index</div>,
      },
      "routes/bar.tsx": {
        default: () => <div>index</div>,
      },
      "routes/foo/index.tsx": {
        default: () => <div>foo/index</div>,
      },
      "routes/foo/_error.tsx": {
        default: () => {
          throw new Error("fail");
        },
      },
      "routes/foo/bar.tsx": {
        default: () => <div>foo/index</div>,
      },
    });

    let res = await server.get("/fooa");
    await res.body?.cancel();
    expect(res.status).toEqual(404);

    res = await server.get("/foo/asdf");
    await res.body?.cancel();
    expect(res.status).toEqual(500);
  },
);

Deno.test(
  "fsRoutes - set headers from handler",
  async () => {
    const server = await createServer<{ text: string }>({
      "routes/index.tsx": {
        handler: (ctx) => {
          return ctx.render(<h1>hello</h1>, {
            headers: { "X-Foo": "123" },
            status: 418,
            statusText: "I'm a fresh teapot",
          });
        },
      },
    });

    const res = await server.get("/");
    await res.body?.cancel();
    expect(res.status).toEqual(418);
    expect(res.statusText).toEqual("I'm a fresh teapot");
    expect(res.headers.get("X-Foo")).toEqual("123");
  },
);

Deno.test("fsRoutes - set request init from handler #2", async () => {
  const server = await createServer({
    "routes/index.tsx": {
      handler: () => {
        return page("foo", { status: 404, headers: { "X-Foo": "123" } });
      },
      default: (ctx) => {
        // deno-lint-ignore no-explicit-any
        return <p>{ctx.data as any}</p>;
      },
    },
  });

  const res = await server.get("/");
  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("foo");
  expect(res.status).toEqual(404);
  expect(res.headers.get("X-Foo")).toEqual("123");
});

Deno.test("fsRoutes - sortRoutePaths", () => {
  let routes = [
    "/foo/[id]",
    "/foo/[...slug]",
    "/foo/bar",
    "/foo/_layout",
    "/foo/index",
    "/foo/_middleware",
    "/foo/bar/_middleware",
    "/foo/_error",
    "/foo/bar/index",
    "/foo/bar/_error",
    "/_error",
    "/foo/bar/[...foo]",
    "/foo/bar/baz",
    "/foo/bar/_layout",
  ];
  let sorted = [
    "/_error",
    "/foo/_middleware",
    "/foo/_layout",
    "/foo/_error",
    "/foo/index",
    "/foo/bar/_middleware",
    "/foo/bar/_layout",
    "/foo/bar/_error",
    "/foo/bar/index",
    "/foo/bar/baz",
    "/foo/bar/[...foo]",
    "/foo/bar",
    "/foo/[id]",
    "/foo/[...slug]",
  ];
  routes.sort(sortRoutePaths);
  expect(routes).toEqual(sorted);

  routes = [
    "/js/index.js",
    "/js/_layout.js",
    "/jsx/index.jsx",
    "/jsx/_layout.jsx",
    "/ts/index.ts",
    "/ts/_layout.tsx",
    "/tsx/index.tsx",
    "/tsx/_layout.tsx",
  ];
  routes.sort(sortRoutePaths);
  sorted = [
    "/js/_layout.js",
    "/js/index.js",
    "/jsx/_layout.jsx",
    "/jsx/index.jsx",
    "/ts/_layout.tsx",
    "/ts/index.ts",
    "/tsx/_layout.tsx",
    "/tsx/index.tsx",
  ];
  expect(routes).toEqual(sorted);
});

Deno.test("fsRoutes - registers default GET route for component without GET handler", async () => {
  const server = await createServer<{ value: boolean }>({
    "routes/noGetHandler.tsx": {
      default: (ctx) => {
        return <h1>{ctx.state.value ? "true" : "false"}</h1>;
      },
      handlers: {
        POST: () => new Response("POST"),
      },
    },
  });

  const postRes = await server.post("/noGetHandler");
  expect(postRes.status).toEqual(200);
  expect(postRes.headers.get("Content-Type")).toEqual(
    "text/plain;charset=UTF-8",
  );
  expect(await postRes.text()).toEqual("POST");

  const getRes = await server.get("/noGetHandler");
  expect(getRes.status).toEqual(200);
  expect(getRes.headers.get("Content-Type")).toEqual(
    "text/html; charset=utf-8",
  );
  expect(await getRes.text()).toContain(
    "<h1>false</h1>",
  );
});

Deno.test("fsRoutes - default GET route doesn't override existing handler", async () => {
  const server = await createServer<{ value: boolean }>({
    "routes/withGetHandler.tsx": {
      default: (ctx) => {
        return <h1>{ctx.state.value ? "true" : "false"}</h1>;
      },
      handlers: {
        POST: () => new Response("POST"),
        GET: (ctx) => {
          ctx.state.value = true;
          return page();
        },
      },
    },
  });

  const postRes = await server.post("/withGetHandler");
  expect(postRes.status).toEqual(200);
  expect(postRes.headers.get("Content-Type")).toEqual(
    "text/plain;charset=UTF-8",
  );
  expect(await postRes.text()).toEqual("POST");

  const getRes = await server.get("/withGetHandler");
  expect(getRes.status).toEqual(200);
  expect(getRes.headers.get("Content-Type")).toEqual(
    "text/html; charset=utf-8",
  );
  expect(await getRes.text()).toContain(
    "<h1>true</h1>",
  );
});

Deno.test("support numeric keys", async () => {
  const TestComponent = () => <div>foo</div>;

  const server = await createServer({
    "routes/index.tsx": {
      default: () => {
        return (
          <>
            <TestComponent key={0} />
            <TestComponent key={1} />
            ok
          </>
        );
      },
    },
  });

  const res = await server.get("/");
  const text = await res.text();
  expect(text).toContain("ok");
});
