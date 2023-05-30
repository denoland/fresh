import { createHandler } from "$fresh/server.ts";
import manifest from "../fresh.gen.ts";
import { superdeno } from "superdeno/mod.ts";
import { assertEquals } from "$std/testing/asserts.ts";
import { type RequestHandlerLike } from "superdeno/src/types.ts";
import { Document, DOMParser } from "deno_dom/deno-dom-wasm.ts";

Deno.test("HTTP assert test.", async (t) => {
  await t.step("#1 GET /", async () => {
    const handler = await createHandler(manifest) as RequestHandlerLike;

    await superdeno(handler)
      .get("/")
      .expect(200);
  });

  await t.step("#2 POST /", async () => {
    const server = await createHandler(manifest) as RequestHandlerLike;

    await superdeno(server)
      .post("/")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send("text=Deno!")
      .expect(303);
  });

  await t.step("#3 GET /foo", async () => {
    const server = await createHandler(manifest) as RequestHandlerLike;

    const r = await superdeno(server)
      .get("/foo")
      .expect(200);

    const document: Document = new DOMParser().parseFromString(
      r.text,
      "text/html",
    )!;

    assertEquals(document.querySelector("div")?.innerText, "Hello Foo!");
  });

  await t.step("#4 GET /foo/bar", async () => {
    const server = await createHandler(manifest) as RequestHandlerLike;

    await superdeno(server)
      .get("/foo/bar")
      .expect(404);
  });
});
