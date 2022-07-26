import { template } from "./render.tsx";
import { assertStringIncludes } from "../../tests/deps.ts";

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
