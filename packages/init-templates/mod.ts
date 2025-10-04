/**
 * Template-based initialization system for Fresh projects.
 *
 * NOTE: This file provides library exports for programmatic use.
 * The main package export (./src/mod.ts) is the CLI entry point for
 * compatibility with the old @fresh/init package.
 *
 * For library usage, import from specific subpaths:
 *   import { initProject } from "@fresh/init-templates/init";
 *
 * This module provides a modern, maintainable approach to generating Fresh
 * projects using file-based templates instead of inline strings.
 *
 * @example
 * ```typescript
 * import { initProject, resolveVersions } from "@fresh/init-templates/init";
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
