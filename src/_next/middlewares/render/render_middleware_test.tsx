import { expect } from "jsr:@std/expect";
import { serveMiddleware } from "../../test_utils.ts";
import { renderMiddleware } from "./render_middleware.ts";

Deno.test("renderMiddleware - responds with HTML", async () => {
  const server = await serveMiddleware(
    renderMiddleware([() => <p>ok</p>], undefined),
  );

  const res = await server.get("/");
  expect(res.headers.get("Content-Type")).toEqual("text/html; charset=utf-8");

  const body = await res.text();
  expect(body).toEqual("<p>ok</p>");
});

Deno.test("renderMiddleware - bypass rendering when handler returns Response", async () => {
  const server = await serveMiddleware(
    renderMiddleware(
      [() => <p>fail</p>],
      () => new Response(null, { status: 204 }),
    ),
  );

  const res = await server.get("/");
  expect(res.status).toEqual(204);
  expect(res.body).toEqual(null);
});

Deno.test("renderMiddleware - chain components", async () => {
  const server = await serveMiddleware(
    renderMiddleware(
      [
        (ctx) => (
          <>
            c1<ctx.Component />
          </>
        ),
        (ctx) => (
          <>
            c2<ctx.Component />
          </>
        ),
        () => <>c3</>,
      ],
      undefined,
    ),
  );

  const res = await server.get("/");
  expect(res.status).toEqual(200);
  expect(await res.text()).toEqual("c1c2c3");
});

// FIXME
Deno.test.ignore("renderMiddleware - chain async components", async () => {
  const server = await serveMiddleware(
    renderMiddleware(
      [
        // deno-lint-ignore require-await
        async (ctx) => (
          <>
            c1<ctx.Component />
          </>
        ),
        // deno-lint-ignore require-await
        async (ctx) => (
          <>
            c2<ctx.Component />
          </>
        ),
        // deno-lint-ignore require-await
        async () => <>c3</>,
      ],
      undefined,
    ),
  );

  const res = await server.get("/");
  expect(res.status).toEqual(200);
  expect(await res.text()).toEqual("c1c2c3");
});
