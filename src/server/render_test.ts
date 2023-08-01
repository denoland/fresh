import { template } from "./render.ts";
import { assertStringIncludes } from "../../tests/deps.ts";

Deno.test("check lang", () => {
  const lang = "fr";
  const body = template({
    bodyHtml: "",
    headComponents: [],
    moduleScripts: [],
    preloads: [],
    lang,
  });
  assertStringIncludes(body, `<html lang="${lang}">`);
});
