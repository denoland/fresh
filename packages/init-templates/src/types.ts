/**
 * Options for initializing a Fresh project (CLI/user input).
 * Optional fields may be undefined and require prompting.
 *
 * @example
 * ```ts
 * const options: InitOptions = {
 *   directory: "./my-app",
 *   tailwind: true,  // or undefined to prompt user
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

  /** Override default versions (mainly for testing) */
  versions?: VersionOverrides;
}

/**
 * Fully resolved options for the template engine.
 * All fields are required - no undefined values.
 * CLI must resolve all options before passing to template engine.
 */
export interface ResolvedInitOptions {
  /** Target directory for the project */
  directory: string;

  /** Use legacy builder instead of Vite */
  builder: boolean;

  /** Include Tailwind CSS setup */
  tailwind: boolean;

  /** Include VS Code configuration */
  vscode: boolean;

  /** Include Docker setup */
  docker: boolean;

  /** Force overwrite existing files */
  force: boolean;
}

/**
 * Version overrides for testing or pinning specific versions.
 * All fields are optional and use camelCase naming.
 *
 * @example
 * ```ts
 * const overrides: VersionOverrides = {
 *   fresh: "2.0.0",
 *   preact: "10.20.0",
 *   // Other versions will use defaults
 * };
 * const versions = await resolveVersions(overrides);
 * ```
 */
export interface VersionOverrides {
  fresh?: string;
  freshTailwind?: string;
  freshVitePlugin?: string;
  preact?: string;
  preactSignals?: string;
  tailwindcss?: string;
  tailwindcssPostcss?: string;
  postcss?: string;
  vite?: string;
  tailwindcssVite?: string;
}

/**
 * Resolved version strings for dependencies.
 * Uses SCREAMING_SNAKE_CASE for template variable substitution (__FRESH_VERSION__).
 *
 * @example
 * ```ts
 * const versions = await resolveVersions();
 * console.log(versions.FRESH_VERSION);  // "2.1.1"
 * console.log(versions.PREACT_VERSION); // "10.27.2"
 * ```
 */
export interface ResolvedVersions {
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

/**
 * Variables available for template substitution.
 * Only PROJECT_NAME and version strings are used for __VARIABLE__ replacement.
 * Boolean flags are included for internal use but not substituted in templates.
 *
 * @example
 * ```ts
 * const variables: TemplateVariables = {
 *   PROJECT_NAME: "my-app",          // Used: __PROJECT_NAME__
 *   FRESH_VERSION: "2.1.1",          // Used: __FRESH_VERSION__
 *   PREACT_VERSION: "10.27.2",       // Used: __PREACT_VERSION__
 *   // ... other versions (all used for substitution)
 *   USE_TAILWIND: true,              // Not substituted, used for logic only
 *   USE_VSCODE: false,               // Not substituted, used for logic only
 *   USE_DOCKER: false,               // Not substituted, used for logic only
 *   USE_VITE: true,                  // Not substituted, used for logic only
 * };
 * ```
 */
export interface TemplateVariables {
  // Project info
  PROJECT_NAME: string;

  // Version strings
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

  // Boolean flags
  USE_TAILWIND: boolean;
  USE_VSCODE: boolean;
  USE_DOCKER: boolean;
  USE_VITE: boolean;
}
