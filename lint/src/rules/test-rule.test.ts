import { expect } from "@std/expect";
import { rule, RULE_NAME } from "./test-rule.ts";

const testPlugin: Deno.lint.Plugin = {
  name: "fresh",
  rules: { [RULE_NAME]: rule },
};

Deno.test("fresh/test - disallow 'test' const", () => {
  const diagnostics = Deno.lint.runPlugin(
    testPlugin,
    "main.ts",
    "const _a = 'a';\n\nconst test = 2;\n",
  );

  const d = diagnostics[0];

  expect(diagnostics.length).toBe(1);
  expect(d.id).toBe("fresh/test");
  expect(d.range).toEqual([23, 27]);
  expect(d.message).toBe("Do not use 'test' as a variable name.");
});
