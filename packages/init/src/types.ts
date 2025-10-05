/**
 * Options for initializing a Fresh project.
 * Optional fields will use defaults or prompt the user.
 *
 * @example
 * ```ts
 * const options: InitOptions = {
 *   directory: "./my-app",
 *   tailwind: true,
 *   vscode: false,
 *   docker: false,
 *   builder: false,
 *   force: false,
 * };
 * ```
 */
export interface InitOptions {
  /** Target directory for the project */
  directory: string;

  /** Use legacy builder instead of Vite (default: false) */
  builder?: boolean;

  /** Include Tailwind CSS setup (default: prompt user) */
  tailwind?: boolean;

  /** Include VS Code configuration (default: prompt user) */
  vscode?: boolean;

  /** Include Docker setup (default: false) */
  docker?: boolean;

  /** Force overwrite existing files (default: false) */
  force?: boolean;
}

/**
 * Version overrides for testing or pinning specific versions.
 * All fields are optional and use camelCase naming.
 */
export type VersionOverrides = Partial<{
  fresh: string;
  freshTailwind: string;
  freshVitePlugin: string;
  preact: string;
  preactSignals: string;
  tailwindcss: string;
  tailwindcssPostcss: string;
  tailwindcssVite: string;
  postcss: string;
  vite: string;
}>;

/**
 * Variables available for template substitution using __VARIABLE__ syntax.
 * All fields represent actual template placeholders in template files.
 *
 * @example
 * ```ts
 * const variables: TemplateVariables = {
 *   PROJECT_NAME: "my-app",
 *   FRESH_VERSION: "2.1.1",
 *   PREACT_VERSION: "10.27.2",
 *   // ... other version strings
 * };
 * // In templates: __PROJECT_NAME__, __FRESH_VERSION__, etc.
 * ```
 */
export interface TemplateVariables {
  PROJECT_NAME: string;
  FRESH_VERSION: string;
  FRESH_TAILWIND_VERSION: string;
  FRESH_VITE_PLUGIN_VERSION: string;
  PREACT_VERSION: string;
  PREACT_SIGNALS_VERSION: string;
  TAILWINDCSS_VERSION: string;
  TAILWINDCSS_POSTCSS_VERSION: string;
  TAILWINDCSS_VITE_VERSION: string;
  POSTCSS_VERSION: string;
  VITE_VERSION: string;
  DENO_VERSION: string;
}
