import { expect } from "@std/expect";
import { delay, serveMiddleware } from "../../test_utils.ts";
import { renderMiddleware } from "./render_middleware.ts";

Deno.test("renderMiddleware - responds with HTML", async () => {
  const server = await serveMiddleware(
    renderMiddleware([() => <p>ok</p>], undefined),
  );

  const res = await server.get("/");
  expect(res.headers.get("Content-Type")).toEqual("text/html; charset=utf-8");

  const body = await res.text();
  expect(body).toEqual("<!DOCTYPE html><p>ok</p>");
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
  expect(await res.text()).toEqual("<!DOCTYPE html>c1c2c3");
});

Deno.test("renderMiddleware - chain async components", async () => {
  const server = await serveMiddleware(
    renderMiddleware(
      [
        async (ctx) => {
          await delay(1);
          return (
            <>
              c1<ctx.Component />
            </>
          );
        },
        async (ctx) => {
          await delay(1);
          return (
            <>
              c2<ctx.Component />
            </>
          );
        },
        async () => {
          await delay(1);
          return <>c3</>;
        },
      ],
      undefined,
    ),
  );

  const res = await server.get("/");
  expect(res.status).toEqual(200);
  expect(await res.text()).toEqual("<!DOCTYPE html>c1c2c3");
});
