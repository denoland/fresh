import { expect } from "@std/expect";
import { Context } from "./context.ts";
import { App } from "fresh";
import { asset } from "fresh/runtime";
import { FakeServer } from "./test_utils.ts";
import { BUILD_ID } from "@fresh/build-id";
import { parseHtml } from "../tests/test_utils.tsx";

Deno.test("FreshReqContext.prototype.redirect", () => {
  let res = Context.prototype.redirect("/");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/");

  res = Context.prototype.redirect("//evil.com");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/evil.com");

  res = Context.prototype.redirect("//evil.com/foo//bar");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/evil.com/foo/bar");

  res = Context.prototype.redirect("https://deno.com");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("https://deno.com");

  res = Context.prototype.redirect("/", 307);
  expect(res.status).toEqual(307);
});

Deno.test("render asset()", async () => {
  const app = new App()
    .get("/", (ctx) =>
      ctx.render(
        <>
          <p class="raw">{asset("/foo")}</p>
          <img src="/foo" srcset="/foo-bar" />
          <source src="/foo" />
        </>,
      ));

  const server = new FakeServer(app.handler());
  const res = await server.get("/");
  const doc = parseHtml(await res.text());

  expect(doc.querySelector(".raw")!.textContent).toContain(BUILD_ID);
  expect(doc.querySelector("img")!.src).toContain(BUILD_ID);
  expect(doc.querySelector("img")!.srcset).toContain(BUILD_ID);
  expect(doc.querySelector("source")!.src).toContain(BUILD_ID);
});

Deno.test("ctx.render - throw with no arguments", async () => {
  const app = new App()
    // deno-lint-ignore no-explicit-any
    .get("/", (ctx) => (ctx as any).render());
  const server = new FakeServer(app.handler());
  const res = await server.get("/");

  await res.body?.cancel();
  expect(res.status).toEqual(500);
});

Deno.test("ctx.render - throw with invalid first arg", async () => {
  const app = new App()
    // deno-lint-ignore no-explicit-any
    .get("/", (ctx) => (ctx as any).render({}));
  const server = new FakeServer(app.handler());
  const res = await server.get("/");

  await res.body?.cancel();
  expect(res.status).toEqual(500);
});

Deno.test("ctx.redirect - preserves partial search param through redirects", async () => {
  const app = new App()
    .get("/old", (ctx) => ctx.redirect("/new"));
  const server = new FakeServer(app.handler());

  // Normal redirect should not have partial param
  let res = await server.get("/old");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/new");

  // Partial redirect should preserve the param
  res = await server.get("/old?fresh-partial=true");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/new?fresh-partial=true");

  // Partial redirect with existing query params
  const app2 = new App()
    .get("/old", (ctx) => ctx.redirect("/new?foo=bar"));
  const server2 = new FakeServer(app2.handler());

  res = await server2.get("/old?fresh-partial=true");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual(
    "/new?foo=bar&fresh-partial=true",
  );

  // Partial redirect with hash fragment — param must come before the hash
  const app3 = new App()
    .get("/old", (ctx) => ctx.redirect("/new#section"));
  const server3 = new FakeServer(app3.handler());

  res = await server3.get("/old?fresh-partial=true");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual(
    "/new?fresh-partial=true#section",
  );
});

Deno.test("ctx.isPartial - should indicate whether request is partial or not", async () => {
  const isPartials: boolean[] = [];
  const app = new App()
    .get("/", (ctx) => {
      isPartials.push(ctx.isPartial);
      return new Response("ok");
    });
  const server = new FakeServer(app.handler());

  await server.get("/");
  await server.get("/?fresh-partial");

  expect(isPartials).toEqual([false, true]);
});

Deno.test("ctx.route - should contain matched route", async () => {
  let route: string | null = null;
  const app = new App()
    .use((ctx) => {
      route = ctx.route;
      return ctx.next();
    })
    .get("/foo/bar", () => new Response("ok"))
    .get("/foo/:id", () => new Response("ok"));

  const server = new FakeServer(app.handler());

  await server.get("/invalid");
  expect(route).toEqual(null);

  await server.get("/foo/bar");
  expect(route).toEqual("/foo/bar");

  await server.get("/foo/123");
  expect(route).toEqual("/foo/:id");
});

Deno.test("ctx.text()", async () => {
  const app = new App()
    .get("/", (ctx) => ctx.text("foobar"));

  const server = new FakeServer(app.handler());
  const res = await server.get("/");

  expect(res.headers.get("Content-Type")).toEqual("text/plain;charset=UTF-8");
  const text = await res.text();
  expect(text).toEqual("foobar");
});

Deno.test("ctx.html()", async () => {
  const app = new App()
    .get("/", (ctx) => ctx.html("<h1>foo</h1>"));

  const server = new FakeServer(app.handler());
  const res = await server.get("/");

  expect(res.headers.get("Content-Type")).toEqual("text/html; charset=utf-8");
  const text = await res.text();
  expect(text).toEqual("<h1>foo</h1>");
});

Deno.test("ctx.json()", async () => {
  const app = new App()
    .get("/", (ctx) => ctx.json({ foo: 123 }));

  const server = new FakeServer(app.handler());
  const res = await server.get("/");

  expect(res.headers.get("Content-Type")).toEqual("application/json");
  const text = await res.text();
  expect(text).toEqual('{"foo":123}');
});

Deno.test("ctx.stream() - enqueue values", async () => {
  function* gen() {
    yield "foo";
    yield new TextEncoder().encode("bar");
  }

  const app = new App()
    .get("/", (ctx) => ctx.stream(gen()));

  const server = new FakeServer(app.handler());
  const res = await server.get("/");
  const text = await res.text();
  expect(text).toEqual("foobar");
});

Deno.test("ctx.stream() - pass function", async () => {
  const app = new App()
    .get("/", (ctx) =>
      ctx.stream(function* () {
        yield "foo";
        yield "bar";
      }));

  const server = new FakeServer(app.handler());
  const res = await server.get("/");
  const text = await res.text();
  expect(text).toEqual("foobar");
});

Deno.test("ctx.stream() - support iterable", async () => {
  function* gen() {
    yield "foo";
    yield "bar";
  }

  const app = new App()
    .get("/", (ctx) => ctx.stream(gen()));

  const server = new FakeServer(app.handler());
  const res = await server.get("/");
  const text = await res.text();

  expect(text).toEqual("foobar");
});

Deno.test("ctx.stream() - support async iterable", async () => {
  async function* gen() {
    yield "foo";
    yield "bar";
  }

  const app = new App()
    .get("/", (ctx) => ctx.stream(gen()));

  const server = new FakeServer(app.handler());
  const res = await server.get("/");
  const text = await res.text();

  expect(text).toEqual("foobar");
});
