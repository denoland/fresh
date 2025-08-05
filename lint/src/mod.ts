import { rules } from "./rules.ts";

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
  rules,
};

export default plugin;
