import * as path from "@std/path";
import * as fs from "@std/fs";
import type {
  InitOptions,
  TemplateVariables,
  VersionOverrides,
} from "./types.ts";
import {
  getLatestVersion,
  getTemplateDir,
  getVariantsDir,
  processFilename,
  substituteVariables,
} from "./utils.ts";

/**
 * Default version constants for dependencies.
 * These are updated automatically by the release script (tools/release.ts).
 */
const FRESH_VERSION = "2.1.1";
const FRESH_TAILWIND_VERSION = "1.0.0";
const PREACT_VERSION = "10.27.2";
const PREACT_SIGNALS_VERSION = "2.3.1";

/**
 * Other dependency versions (not automatically updated).
 * Update these manually when needed.
 */
const FRESH_VITE_PLUGIN_VERSION = "1.0.0";
const TAILWINDCSS_VERSION = "4.1.10";
const TAILWINDCSS_POSTCSS_VERSION = "4.1.10";
const TAILWINDCSS_VITE_VERSION = "4.1.12";
const POSTCSS_VERSION = "8.5.6";
const VITE_VERSION = "7.1.3";

/**
 * Initialize a new Fresh project using templates.
 * This is a pure template processor - all validation, prompts, and output
 * should be handled by the caller (typically CLI).
 *
 * @example
 * ```ts
 * import { initProject, resolveVersions } from "./init.ts";
 *
 * const options: InitOptions = {
 *   directory: "./my-app",
 *   tailwind: true,
 *   vscode: false,
 *   docker: false,
 *   builder: false,
 *   force: false,
 * };
 *
 * const versions = await resolveVersions();
 * await initProject(Deno.cwd(), options, versions);
 * ```
 *
 * @param cwd - Current working directory
 * @param options - Initialization options (optional fields will use defaults)
 * @param versions - Pre-resolved version strings (without PROJECT_NAME)
 */
export async function initProject(
  cwd: string,
  options: Required<InitOptions>,
  versions: Omit<TemplateVariables, "PROJECT_NAME">,
): Promise<void> {
  const projectDir = path.resolve(cwd, options.directory);
  const projectName = path.basename(projectDir);

  // Boolean flags for template/variant selection (not template variables)
  const useVite = !options.builder;
  const useTailwind = options.tailwind;
  const useVSCode = options.vscode;
  const useDocker = options.docker;

  // Template substitution variables (includes PROJECT_NAME + all versions)
  const variables: TemplateVariables = {
    ...versions,
    PROJECT_NAME: projectName,
  };

  // Select complete template based on build system and styling choice
  let templateName: string;
  if (useVite && useTailwind) {
    templateName = "vite-tailwind";
  } else if (useVite) {
    templateName = "vite";
  } else if (useTailwind) {
    templateName = "builder-tailwind";
  } else {
    templateName = "builder";
  }

  const templateDir = path.join(getTemplateDir(), templateName);

  // Collect truly additive variants (docker, vscode, vscode-tailwind)
  const variants: string[] = [];
  if (useVSCode) {
    variants.push("vscode");
    // Add Tailwind-specific VS Code support if both are enabled
    if (useTailwind) {
      variants.push("vscode-tailwind");
    }
  }
  if (useDocker) {
    variants.push("docker");
  }

  // Process template
  await processTemplate(templateDir, variants, projectDir, variables);

  // Fetch and write favicon
  await fetchFavicon(projectDir);
}

/**
 * Resolve all version strings for dependencies.
 *
 * Version resolution strategy:
 * - Only Fresh core version is fetched from network (latest from JSR)
 * - All other versions use fixed defaults (updated by release script)
 *
 * @example
 * ```ts
 * // Resolve with defaults
 * const versions = await resolveVersions();
 * console.log(versions.FRESH_VERSION); // "2.1.1" or latest from network
 *
 * // Override specific versions (useful for testing)
 * const testVersions = await resolveVersions({
 *   fresh: "2.0.0",
 *   preact: "10.20.0",
 * });
 * ```
 *
 * @param overrides - Optional version overrides for testing or pinning
 * @returns Template variables (without PROJECT_NAME, which is added later)
 */
export async function resolveVersions(
  overrides?: VersionOverrides,
): Promise<Omit<TemplateVariables, "PROJECT_NAME">> {
  // Build default versions object
  const defaults = {
    fresh: FRESH_VERSION,
    freshTailwind: FRESH_TAILWIND_VERSION,
    freshVitePlugin: FRESH_VITE_PLUGIN_VERSION,
    preact: PREACT_VERSION,
    preactSignals: PREACT_SIGNALS_VERSION,
    tailwindcss: TAILWINDCSS_VERSION,
    tailwindcssPostcss: TAILWINDCSS_POSTCSS_VERSION,
    tailwindcssVite: TAILWINDCSS_VITE_VERSION,
    postcss: POSTCSS_VERSION,
    vite: VITE_VERSION,
  };

  const versions = { ...defaults, ...overrides };

  // Only fetch latest for Fresh core from JSR
  const fresh = await getLatestVersion("@fresh/core", versions.fresh);

  return {
    FRESH_VERSION: fresh,
    FRESH_TAILWIND_VERSION: versions.freshTailwind,
    FRESH_VITE_PLUGIN_VERSION: versions.freshVitePlugin,
    // Use fixed versions for Preact and Signals (not fetched from network)
    PREACT_VERSION: versions.preact,
    PREACT_SIGNALS_VERSION: versions.preactSignals,
    TAILWINDCSS_VERSION: versions.tailwindcss,
    TAILWINDCSS_POSTCSS_VERSION: versions.tailwindcssPostcss,
    TAILWINDCSS_VITE_VERSION: versions.tailwindcssVite,
    POSTCSS_VERSION: versions.postcss,
    VITE_VERSION: versions.vite,
    DENO_VERSION: Deno.version.deno,
  };
}

/**
 * Process a template and write to target directory.
 */
async function processTemplate(
  templateDir: string,
  variants: string[],
  targetDir: string,
  variables: TemplateVariables,
): Promise<void> {
  // Ensure target directory exists
  await fs.ensureDir(targetDir);

  // Copy base template
  await processDirectory(templateDir, targetDir, variables);

  // Apply variants
  const variantsDir = getVariantsDir();
  for (const variant of variants) {
    const variantDir = path.join(variantsDir, variant);
    try {
      await Deno.stat(variantDir);
      await applyVariant(variantDir, targetDir, variables);
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) {
        throw err;
      }
      // Variant doesn't exist, skip it
    }
  }
}

/**
 * Process a directory, copying and transforming files.
 */
async function processDirectory(
  srcDir: string,
  destDir: string,
  variables: TemplateVariables,
): Promise<void> {
  for await (const entry of Deno.readDir(srcDir)) {
    const srcPath = path.join(srcDir, entry.name);

    if (entry.isDirectory) {
      // Process directory name (convert __ to .)
      const destName = processFilename(entry.name);
      const destPath = path.join(destDir, destName);
      await fs.ensureDir(destPath);
      await processDirectory(srcPath, destPath, variables);
    } else {
      // For files, don't process filename here - processFile will handle it
      await processFile(srcPath, destDir, entry.name, variables);
    }
  }
}

/**
 * Process a single file.
 */
async function processFile(
  srcPath: string,
  destDir: string,
  filename: string,
  variables: TemplateVariables,
): Promise<void> {
  // Process filename: convert __ prefix to . prefix
  const finalName = processFilename(filename);
  const destPath = path.join(destDir, finalName);

  // Try to read as text and perform substitution on ALL files
  // If file is binary, the copy will fail gracefully and we'll copy as binary
  try {
    const content = await Deno.readTextFile(srcPath);
    const transformed = substituteVariables(
      content,
      variables as unknown as Record<string, string | boolean | number>,
    );
    await Deno.writeTextFile(destPath, transformed);
  } catch {
    // File is binary or unreadable as text, copy as-is
    await fs.copy(srcPath, destPath, { overwrite: true });
  }
}

/**
 * Apply a variant overlay to the target directory.
 * Variants are truly additive - they only add files, don't modify existing ones.
 */
async function applyVariant(
  variantDir: string,
  targetDir: string,
  variables: TemplateVariables,
): Promise<void> {
  for await (const entry of Deno.readDir(variantDir)) {
    const srcPath = path.join(variantDir, entry.name);

    if (entry.isDirectory) {
      // Process directory name (convert __ to .)
      const destName = processFilename(entry.name);
      const destPath = path.join(targetDir, destName);
      await fs.ensureDir(destPath);
      await processDirectory(srcPath, destPath, variables);
    } else {
      // Regular file - copy/process
      await processFile(srcPath, targetDir, entry.name, variables);
    }
  }
}

/**
 * Fetch and write favicon.
 */
async function fetchFavicon(projectDir: string): Promise<void> {
  try {
    const res = await fetch("https://fresh.deno.dev/favicon.ico");
    if (!res.ok) return;

    const buf = await res.arrayBuffer();
    const faviconPath = path.join(projectDir, "static", "favicon.ico");
    await Deno.writeFile(faviconPath, new Uint8Array(buf));
  } catch {
    // Silent failure - favicon is not critical
  }
}
