import { expect } from "@std/expect";
import { FreshReqContext } from "./context.ts";
import { App } from "@fresh/core";
import { asset } from "@fresh/core/runtime";
import { FakeServer } from "./test_utils.ts";
import { BUILD_ID } from "./runtime/build_id.ts";
import { parseHtml } from "../tests/test_utils.tsx";

Deno.test("FreshReqContext.prototype.redirect", () => {
  let res = FreshReqContext.prototype.redirect("/");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/");

  res = FreshReqContext.prototype.redirect("//evil.com");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/evil.com");

  res = FreshReqContext.prototype.redirect("//evil.com/foo//bar");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/evil.com/foo/bar");

  res = FreshReqContext.prototype.redirect("https://deno.com");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("https://deno.com");

  res = FreshReqContext.prototype.redirect("/", 307);
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

  const server = new FakeServer(await app.handler());
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
  const server = new FakeServer(await app.handler());
  const res = await server.get("/");

  await res.body?.cancel();
  expect(res.status).toEqual(500);
});

Deno.test("ctx.render - throw with invalid first arg", async () => {
  const app = new App()
    // deno-lint-ignore no-explicit-any
    .get("/", (ctx) => (ctx as any).render({}));
  const server = new FakeServer(await app.handler());
  const res = await server.get("/");

  await res.body?.cancel();
  expect(res.status).toEqual(500);
});
