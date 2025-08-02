import { NO_VISITOR, pathSegments } from "../utils.ts";

/**
 * Reports server components that install client side event handlers.
 *
 * Disallows `on*` attributes for JSX components inside the
 * `routes/` directory, as these components are rendered on the server.
 *
 * @example
 * ```tsx
 * // routes/index.ts
 * <button onClick={() => {}} />
 *      // ^^^^^^^^^^^^^^^^^^ invalid handler
 * ```
 *
 * The `(_islands)` directory is excluded from this lint rule.
 *
 * @module
 */

export const RULE_NAME = "server-event-handlers";

const MESSAGE = "Server components cannot install client side event handlers.";
const HINT =
  "Remove this property or turn the enclosing component into an island";

const CUSTOM_ELEMENT_FN_EXPR_ATTR_SELECTOR =
  'JSXOpeningElement[name.type="JSXIdentifier"][name.name=/-/] > JSXAttribute[name.type="JSXIdentifier"]:has(> JSXExpressionContainer[expression.type=/^(FunctionExpression|ArrowFunctionExpression)$/])';
const HTML_ELEMENT_ON_ATTR_SELECTOR =
  'JSXOpeningElement[name.type="JSXIdentifier"][name.name=/^[a-z]+$/] > JSXAttribute[name.type="JSXIdentifier"][name.name=/^on/]';

export const rule: Deno.lint.Rule = {
  create(ctx) {
    const path = pathSegments(ctx.filename);

    // Ignore island components or components outside `routes/` dir
    if (path.isIsland() || !path.isRoute()) return NO_VISITOR;

    const reportNode = (node: Deno.lint.JSXAttribute) => {
      ctx.report({
        message: MESSAGE,
        hint: HINT,
        node,
        range: node.range,
      });
    };

    return {
      [CUSTOM_ELEMENT_FN_EXPR_ATTR_SELECTOR]: reportNode,
      [HTML_ELEMENT_ON_ATTR_SELECTOR]: reportNode,
    };
  },
};
