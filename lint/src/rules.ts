import * as test from "./rules/test-rule.ts";

export const rules: Deno.lint.Plugin["rules"] = {
  [test.RULE_NAME]: test.rule,
};
