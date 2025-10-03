/**
 * Template-based initialization system for Fresh projects.
 *
 * This module provides a modern, maintainable approach to generating Fresh
 * projects using file-based templates instead of inline strings.
 *
 * @example
 * ```typescript
 * import { initProject } from "@fresh/init-templates";
 *
 * await initProject(Deno.cwd(), {
 *   directory: "./my-fresh-app",
 *   tailwind: true,
 *   vscode: true,
 * });
 * ```
 *
 * @module
 */

export { initProject } from "./src/init.ts";
export type { InitOptions, TemplateVariables } from "./src/types.ts";
export { InitError } from "./src/errors.ts";
