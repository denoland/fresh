/**
 * Options for initializing a Fresh project (CLI/user input).
 * Optional fields may be undefined and require prompting.
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

/**
 * Metadata about a template.
 */
export interface TemplateInfo {
  /** Template directory name */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Template description */
  description: string;
  /** Path to template directory */
  path: string;
}

/**
 * Metadata about a template variant.
 */
export interface VariantInfo {
  /** Variant directory name */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Variant description */
  description: string;
  /** Path to variant directory */
  path: string;
  /** Compatible base templates */
  compatibleWith: string[];
}
