import { h } from "preact";
import { template } from "./render.ts";
import { assertEquals, assertStringIncludes } from "../../tests/deps.ts";

Deno.test("check lang", () => {
  const lang = "fr";
  const body = template({
    bodyHtml: "",
    headComponents: [],
    imports: [],
    preloads: [],
    lang,
  });
  assertStringIncludes(body, `<html lang="${lang}">`);
});

Deno.test("charset/viewport set by default", () => {
  const body = template({
    bodyHtml: "",
    headComponents: [],
    imports: [],
    preloads: [],
    lang: "en",
  });
  assertStringIncludes(body, `<meta charSet="`);
  assertStringIncludes(body, `<meta name="viewport"`);
});

Deno.test("no default charset/viewport if manually specified", () => {
  const body = template({
    bodyHtml: "",
    headComponents: [
      h("meta", { charSet: "foo" }),
      [h("meta", { name: "viewport", content: "bar" })],
    ],
    imports: [],
    preloads: [],
    lang: "en",
  });
  assertStringIncludes(body, `<meta charSet="foo" />`);
  assertStringIncludes(body, `<meta name="viewport" content="bar" />`);
  assertEquals(body.split(`<meta charSet="`).length - 1, 1);
  assertEquals(body.split(`<meta name="viewport"`).length - 1, 1);
});
