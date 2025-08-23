import * as handlerExport from "./rules/handler-export.ts";
import * as serverEventHandlers from "./rules/server-event-handlers.ts";

/** Expected shape of each lint rule module */
export interface RuleModule {
  /** The name of the lint rule, which becomes `fresh/<rule-name>` */
  RULE_NAME: string;
  /** Rule implementation */
  rule: Deno.lint.Rule;
}

/**
 * Plugin for Fresh linting rules.
 *
 * For a full list of rules, see {@linkcode rules}.
 *
 * Enable lint rules by updating `deno.json`, each rule
 * should be prefixed with `fresh/<rule_name>`.
 *
 * @example
 * ```json deno.json
 * {
 *   "lint": {
 *     "plugins": ["@fresh/lint"],
 *     "rules": {
 *       "include": ["fresh/test"]
 *     }
 *   }
 * }
 * ```
 */
const plugin: Deno.lint.Plugin = {
  name: "fresh",
  rules: createRules(handlerExport, serverEventHandlers),
};

function createRules(...modules: RuleModule[]): Deno.lint.Plugin["rules"] {
  return Object.fromEntries(modules.map((mod) => [mod.RULE_NAME, mod.rule]));
}

export default plugin;
