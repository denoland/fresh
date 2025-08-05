/**
 * This rule is just a test.
 *
 * @module
 */

export const RULE_NAME = "test";

export const rule: Deno.lint.Rule = {
  create(ctx) {
    const bannedVarName = "test";
    const selector =
      `VariableDeclaration > VariableDeclarator > Identifier[name="${bannedVarName}"]`;

    return {
      [selector](node: Deno.lint.Identifier) {
        ctx.report({
          message: `Do not use '${bannedVarName}' as a variable name.`,
          node,
          range: node.range,
        });
      },
    };
  },
};
