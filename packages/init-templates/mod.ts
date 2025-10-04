/**
 * Template-based initialization system for Fresh projects.
 *
 * This module provides a modern, maintainable approach to generating Fresh
 * projects using file-based templates instead of inline strings.
 *
 * @example
 * ```typescript
 * import { initProject, resolveVersions } from "@fresh/init-templates";
 *
 * // Resolve versions from network (or use defaults)
 * const versions = await resolveVersions();
 *
 * // Initialize project with fully resolved options
 * await initProject(Deno.cwd(), {
 *   directory: "./my-fresh-app",
 *   builder: false,
 *   tailwind: true,
 *   vscode: true,
 *   docker: false,
 *   force: false,
 * }, versions);
 * ```
 *
 * @module
 */

export { initProject, resolveVersions } from "./src/init.ts";
export type {
  InitOptions,
  ResolvedInitOptions,
  ResolvedVersions,
  TemplateVariables,
} from "./src/types.ts";
