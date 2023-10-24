import {
  assertNotSelector,
  assertSelector,
  assertTextMany,
  withFakeServe,
} from "$fresh/tests/test_utils.ts";
import { assertNotMatch } from "$std/testing/asserts.ts";

Deno.test("doesn't apply internal app template", async () => {
  await withFakeServe(
    "./tests/fixture_explicit_app/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/`);

      // Doesn't render internal app template
      assertNotSelector(doc, "body body");

      assertSelector(doc, "html > head");
      assertSelector(doc, "html > body");
      assertSelector(doc, `meta[charset="utf-8"]`);
      assertSelector(
        doc,
        `meta[name="viewport"][content="width=device-width, initial-scale=1.0"]`,
      );
      assertTextMany(doc, "title", ["fresh title"]);

      // Still renders page
      assertSelector(doc, "body > .inner-body > .page");
    },
  );
});

Deno.test("user _app works with <Head>", async () => {
  await withFakeServe(
    "./tests/fixture_explicit_app/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/head`);

      // Doesn't render internal app template
      assertNotSelector(doc, "body body");

      assertSelector(doc, "html > head");
      assertSelector(doc, "html > body");
      assertSelector(doc, `meta[charset="utf-8"]`);
      assertSelector(
        doc,
        `meta[name="viewport"][content="width=device-width, initial-scale=1.0"]`,
      );
      assertSelector(
        doc,
        `meta[name="fresh"][content="test"]`,
      );

      // Still renders page
      assertSelector(doc, "body > .inner-body > .page");
    },
  );
});

Deno.test("don't duplicate <title>", async () => {
  await withFakeServe(
    "./tests/fixture_explicit_app/main.ts",
    async (server) => {
      const doc = await server.getHtml(`/title`);
      assertTextMany(doc, "title", ["foo bar"]);
    },
  );
});

Deno.test("sets <html> + <head> + <body> classes", async () => {
  await withFakeServe(
    "./tests/fixture_explicit_app/main.ts",
    async (server) => {
      const doc = await server.getHtml(``);
      assertSelector(doc, "html.html");
      assertSelector(doc, "head.head");
      assertSelector(doc, "body.body");
    },
  );
});

// Issue: https://github.com/denoland/fresh/issues/1666
Deno.test("renders valid html document", async () => {
  await withFakeServe(
    "./tests/fixture_explicit_app/main.ts",
    async (server) => {
      const res = await server.get("/");
      const text = await res.text();

      assertNotMatch(text, /<\/body><\/head>/);
    },
  );
});
