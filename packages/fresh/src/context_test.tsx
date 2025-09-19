import { expect } from "@std/expect";
import { Context } from "./context.ts";
import { App } from "fresh";
import { asset } from "fresh/runtime";
import { FakeServer } from "./test_utils.ts";
import { BUILD_ID } from "@fresh/build-id";
import { parseHtml } from "@fresh/internal/test-utils";

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
