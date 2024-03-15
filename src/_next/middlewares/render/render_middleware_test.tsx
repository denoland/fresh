import { expect } from "jsr:@std/expect";
import { serveMiddleware } from "../../test_utils.ts";
import { renderMiddleware } from "./render_middleware.ts";

Deno.test("renderMiddleware - responds with HTML", async () => {
  const server = await serveMiddleware(
    renderMiddleware([() => <p>ok</p>], () => {}),
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

  const res = await server.head("/");
  expect(res.status).toEqual(204);
  expect(res.body).toEqual(null);
});
