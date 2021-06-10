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
  assertStringIncludes(body, "<p>Viewing JIT render.</p>");
  assertStringIncludes(
    body,
    `<script id="__FRSH_PROPS" type="application/json">{"params":{}}</script>`,
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
    `<script id="__FRSH_PROPS" type="application/json">{"params":{"name":"foo"}}</script>`,
  );
});

Deno.test("/api/name", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/api/name"));
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(
    resp.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  const body = await resp.json();
  assertEquals(body, { name: "fresh" });
});

Deno.test("/api/xyz not found", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/api/xyz"));
  assert(resp);
  assertEquals(resp.status, 404);
});
