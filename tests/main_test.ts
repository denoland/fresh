import { router as r, ServerContext } from "../server.ts";
import { assert, assertEquals, assertStringIncludes } from "./deps.ts";
import routes from "./fixture/routes.gen.ts";

const router = r.router(ServerContext.fromRoutes(routes).routes());

Deno.test("/ page prerender", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/"));
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
  const body = await resp.text();
  assertStringIncludes(body, "index.js");
  assertStringIncludes(body, "<p>Hello!</p>");
  assertStringIncludes(body, "<p>Viewing JIT render.</p>");
  assertStringIncludes(
    body,
    `<script id="__FRSH_PROPS" type="application/json">`,
  );
  assert(!body.includes(`"params"`));
  assertStringIncludes(
    body,
    `"data":[["home","Hello!"]]`,
  );
});

Deno.test("/[name] page prerender", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/foo"));
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
  const body = await resp.text();
  assertStringIncludes(body, "[name].js");
  assertStringIncludes(body, "<div>Hello foo</div>");
  assertStringIncludes(
    body,
    `<script id="__FRSH_PROPS" type="application/json">`,
  );
  assertStringIncludes(
    body,
    `"params":{"name":"foo"}`,
  );
});

Deno.test("/api/name - GET", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/api/name"));
  assert(resp);
  assertEquals(resp.status, 200);
  const body = await resp.text();
  assertEquals(body, "Get fresh!");
});

Deno.test("/api/name - default", async () => {
  const resp = await router(
    new Request("https://fresh.deno.dev/api/name", {
      method: "POST",
    }),
  );
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(
    resp.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  const body = await resp.json();
  assertEquals(body, { name: "fresh" });
});

Deno.test("/api/get_only - NOTAMETHOD", async () => {
  const resp = await router(
    new Request("https://fresh.deno.dev/api/get_only", {
      method: "NOTAMETHOD",
    }),
  );
  assert(resp);
  assertEquals(resp.status, 405);
  assertEquals(
    resp.headers.get("accept"),
    "GET",
  );
});

Deno.test("/api/xyz not found", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/api/xyz"));
  assert(resp);
  assertEquals(resp.status, 404);
});

Deno.test("/static page prerender", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/static"));
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
  const body = await resp.text();
  assert(!body.includes(`static.js`));
  assert(!body.includes(`</script>`));
  assertStringIncludes(body, "<p>This is a static page.</p>");
  assert(!body.includes("__FRSH_PROPS"));
});
