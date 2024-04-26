import { expect } from "@std/expect";
import { redirectTo } from "./context.ts";
import { App } from "@fresh/core";
import { asset } from "@fresh/core/runtime";
import { FakeServer } from "./test_utils.ts";
import { BUILD_ID } from "./runtime/build_id.ts";
import { parseHtml } from "../tests/test_utils.tsx";

Deno.test("redirectTo", () => {
  let res = redirectTo("/");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/");

  res = redirectTo("//evil.com");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/evil.com");

  res = redirectTo("//evil.com/foo//bar");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("/evil.com/foo/bar");

  res = redirectTo("https://deno.com");
  expect(res.status).toEqual(302);
  expect(res.headers.get("Location")).toEqual("https://deno.com");

  res = redirectTo("/", 307);
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
