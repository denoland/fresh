import * as path from "@std/path";
import * as fs from "@std/fs";
import type {
  ResolvedInitOptions,
  ResolvedVersions,
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
 * These should match the current init package.
 */
export const DEFAULT_VERSIONS = {
  fresh: "2.1.1",
  freshTailwind: "1.0.0",
  freshVitePlugin: "1.0.0",
  preact: "10.27.2",
  preactSignals: "2.3.1",
  tailwindcss: "4.1.10",
  tailwindcssPostcss: "4.1.10",
  tailwindcssVite: "4.1.12",
  postcss: "8.5.6",
  vite: "7.1.3",
};

/**
 * Initialize a new Fresh project using templates.
 * This is a pure template processor - all validation, prompts, and output
 * should be handled by the caller (typically CLI).
 *
 * @param cwd - Current working directory
 * @param options - Fully resolved initialization options (no undefined values)
 * @param versions - Pre-resolved version strings for dependencies
 */
export async function initProject(
  cwd: string,
  options: ResolvedInitOptions,
  versions: ResolvedVersions,
): Promise<void> {
  const projectDir = path.resolve(cwd, options.directory);
  const projectName = path.basename(projectDir);

  const useVite = !options.builder;
  const useTailwind = options.tailwind;
  const useVSCode = options.vscode;
  const useDocker = options.docker;

  // Create variables context
  const variables: TemplateVariables = {
    PROJECT_NAME: projectName,
    ...versions,
    USE_TAILWIND: useTailwind,
    USE_VSCODE: useVSCode,
    USE_DOCKER: useDocker,
    USE_VITE: useVite,
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
 * Resolve all version strings.
 *
 * NOTE: This matches the behavior of the old @fresh/init package:
 * - Only Fresh core version is fetched from network
 * - All other versions use fixed defaults (updated by release script)
 * - This is exported so CLI can call it separately from template processing
 */
export async function resolveVersions(
  overrides?: VersionOverrides,
): Promise<ResolvedVersions> {
  const versions = { ...DEFAULT_VERSIONS, ...overrides };

  // Only fetch latest for Fresh core (matching old init behavior)
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
