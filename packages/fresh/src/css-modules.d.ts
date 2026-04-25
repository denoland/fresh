/**
 * Ambient type declarations for CSS Modules.
 *
 * Add this to your project's `deno.json` compiler options:
 *
 * ```json
 * {
 *   "compilerOptions": {
 *     "types": ["fresh/css-modules"]
 *   }
 * }
 * ```
 *
 * Or reference it directly in a source file:
 *
 * ```ts
 * /// <reference types="fresh/css-modules" />
 * ```
 *
 * @module
 */

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}
