import { NO_VISITOR, pathSegments } from "../utils.ts";

/**
 * Reports routes using an incorrect export name for handlers.
 *
 * @example
 * ```tsx
 * // routes/index.ts
 * export const handlers = () => {};
 *           // ^^^^^^^^ should be "handler"
 * ```
 *
 * @module
 */

export const RULE_NAME = "handler-export";

const MESSAGE =
  'Fresh middlewares must be exported as "handler" but got "handlers" instead.';
const HINT = 'Did you mean "handler"?';

const HANDLERS_NAME = "handlers";
const HANDLERS_EXPORT_SELECTOR =
  `ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > Identifier[name=${HANDLERS_NAME}],
   ExportNamedDeclaration > FunctionDeclaration > Identifier[name=${HANDLERS_NAME}]`;

export const rule: Deno.lint.Rule = {
  create(ctx) {
    // Ignore files outside `routes/` dir
    if (!pathSegments(ctx.filename).isRoute()) return NO_VISITOR;

    return {
      [HANDLERS_EXPORT_SELECTOR](node: Deno.lint.Identifier) {
        ctx.report({
          message: MESSAGE,
          hint: HINT,
          node,
          range: node.range,
        });
      },
    };
  },
};
