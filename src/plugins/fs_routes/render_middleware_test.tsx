import { expect } from "@std/expect";
import { delay, serveMiddleware } from "../../test_utils.ts";
import { renderMiddleware } from "./render_middleware.ts";
import { parseHtml } from "../../../tests/test_utils.tsx";

Deno.test("renderMiddleware - responds with HTML", async () => {
  const server = await serveMiddleware(
    renderMiddleware([() => <p>ok</p>], undefined),
  );

  const res = await server.get("/");
  expect(res.headers.get("Content-Type")).toEqual("text/html; charset=utf-8");

  const doc = parseHtml(await res.text());
  // deno-lint-ignore no-explicit-any
  expect((doc.body.firstChild as any).outerHTML).toEqual("<p>ok</p>");
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
          <div>
            c1<ctx.Component />
          </div>
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

  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild?.textContent).toEqual("c1c2c3");
});

Deno.test("renderMiddleware - chain async components", async () => {
  const server = await serveMiddleware(
    renderMiddleware(
      [
        async (ctx) => {
          await delay(1);
          return (
            <div>
              c1<ctx.Component />
            </div>
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

  const doc = parseHtml(await res.text());
  expect(doc.body.firstChild!.textContent).toEqual("c1c2c3");
});

Deno.test("renderMiddleware - async components Response bail out", async () => {
  const server = await serveMiddleware(
    renderMiddleware(
      [
        async (ctx) => {
          await delay(1);
          return (
            <div>
              c1<ctx.Component />
            </div>
          );
        },
        async () => {
          await delay(1);

          return new Response("foo");
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

  expect(await res.text()).toEqual("foo");
});
