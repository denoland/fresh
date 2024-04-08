import { assertEquals, dirname, fromFileUrl, join } from "./deps.ts";
import { withFakeServe } from "./test_utils.ts";

Deno.test("don't fallthrough to /_fresh/static in dev", async () => {
  const fixtureDir = join(
    dirname(fromFileUrl(import.meta.url)),
    "fixture_static",
  );

  try {
    await Deno.mkdir(join(fixtureDir, "_fresh", "static"), { recursive: true });
  } catch (_err) {
    // ignore
  }
  await Deno.writeTextFile(
    join(fixtureDir, "_fresh", "static", "style.css"),
    "h1 { color: blue; }",
  );

  await withFakeServe(
    "./tests/fixture_static/dev.ts",
    async (server) => {
      const res = await server.get(`/style.css`);
      const css = await res.text();
      assertEquals(css.replace(/\s+/g, ""), "h1{color:red;}");
    },
  );

  await Deno.remove(join(fixtureDir, "_fresh", "static", "style.css"));

  await withFakeServe(
    "./tests/fixture_static/dev.ts",
    async (server) => {
      const res = await server.get(`/style.css`);
      const css = await res.text();
      assertEquals(css.replace(/\s+/g, ""), "h1{color:red;}");
    },
  );
});

Deno.test("fallthrough to /_fresh/static in normal mode", async () => {
  const fixtureDir = join(
    dirname(fromFileUrl(import.meta.url)),
    "fixture_static",
  );

  try {
    await Deno.mkdir(join(fixtureDir, "_fresh", "static"), { recursive: true });
  } catch (_err) {
    // ignore
  }
  await Deno.writeTextFile(
    join(fixtureDir, "_fresh", "static", "style.css"),
    "h1 { color: blue; }",
  );

  await withFakeServe(
    "./tests/fixture_static/main.ts",
    async (server) => {
      const res = await server.get(`/style.css`);
      const css = await res.text();
      assertEquals(css.replace(/\s+/g, ""), "h1{color:blue;}");
    },
  );
});
