import { assertStringIncludes } from "./deps.ts";
import { withFakeServe } from "./test_utils.ts";

Deno.test("control", async () => {
  await withFakeServe(
    "./tests/fixture_disable_trailing_slash_redirect/dev.ts",
    async (server) => {
      const res = await server.get("/about");
      const content = await res.text();
      assertStringIncludes(content, "<div>about</div>");
    },
    { loadConfig: true },
  );
});

Deno.test("404 with slash", async () => {
  await withFakeServe(
    "./tests/fixture_disable_trailing_slash_redirect/dev.ts",
    async (server) => {
      // the router doesn't support defining routes like this, but we should at least be able to detect this.
      // without this feature this test won't work, since the redirect occurs before our middleware can handle it
      const res = await server.get("/about/");
      const content = await res.text();
      assertStringIncludes(content, "<p>Has trailing slash: Yes</p>");
    },
    { loadConfig: true },
  );
});

Deno.test("404 without slash", async () => {
  await withFakeServe(
    "./tests/fixture_disable_trailing_slash_redirect/dev.ts",
    async (server) => {
      // just for good measure ensure our middleware properly works for "normal" errors
      const res = await server.get("/foo");
      const content = await res.text();
      assertStringIncludes(content, "<p>Has trailing slash: No</p>");
    },
    { loadConfig: true },
  );
});
