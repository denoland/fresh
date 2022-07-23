import { template } from "./render.tsx";
import { assertStringIncludes } from "../../tests/deps.ts";
Deno.test("check lang", () => {
  const lang = "fr";
  const body = template({
    bodyHtml: "",
    headComponents: [],
    imports: [],
    preloads: [],
    styles: [],
    lang,
  });
  assertStringIncludes(body, `<html lang="${lang}">`);
});
Deno.test("check bodyClass", () => {
  const bodyClass = "dark";
  const body = template({
    bodyHtml: "",
    headComponents: [],
    imports: [],
    preloads: [],
    styles: [],
    lang: "",
    bodyClass,
  });
  assertStringIncludes(body, `<body class="${bodyClass}">`);
});
