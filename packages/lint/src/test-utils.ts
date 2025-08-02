import type { RuleModule } from "./plugin.ts";

/** Create a test lint plugin for the given rule */
export function testPlugin({ rule, RULE_NAME }: RuleModule): Deno.lint.Plugin {
  return {
    name: `fresh`,
    rules: { [RULE_NAME]: rule },
  };
}
