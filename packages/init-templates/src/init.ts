// deno-lint-ignore-file no-console
import * as colors from "@std/fmt/colors";
import * as path from "@std/path";
import * as fs from "@std/fs";
import type { InitOptions, TemplateVariables } from "./types.ts";
import { InitError } from "./errors.ts";
import {
  confirmOrValue,
  getLatestVersion,
  getTemplateDir,
  isDirectoryEmpty,
  processFilename,
  substituteVariables,
} from "./utils.ts";

// Default version constants - these should match the current init package
const DEFAULT_VERSIONS = {
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

const CONFIRM_EMPTY_MESSAGE =
  "The target directory is not empty (files could get overwritten). Do you want to continue anyway?";
const CONFIRM_TAILWIND_MESSAGE = `Set up ${
  colors.cyan("Tailwind CSS")
} for styling?`;
const CONFIRM_VSCODE_MESSAGE = `Do you use ${colors.cyan("VS Code")}?`;

/**
 * Initialize a new Fresh project using templates.
 */
export async function initProject(
  cwd: string,
  options: InitOptions,
): Promise<void> {
  console.log();
  console.log(
    colors.bgRgb8(
      colors.rgb8(" 🍋 Fresh: The next-gen web framework. ", 0),
      121,
    ),
  );
  console.log();

  // Resolve target directory
  const projectDir = path.resolve(cwd, options.directory);
  const projectName = path.basename(projectDir);

  // Check if directory is empty
  const isEmpty = await isDirectoryEmpty(projectDir);
  if (!isEmpty) {
    const shouldContinue = options.force !== undefined
      ? options.force
      : confirm(CONFIRM_EMPTY_MESSAGE);

    if (!shouldContinue) {
      throw new InitError("Directory is not empty.");
    }
  }

  // Determine configuration
  const useVite = !options.builder;
  const useTailwind = confirmOrValue(
    CONFIRM_TAILWIND_MESSAGE,
    options.tailwind,
  );
  const useVSCode = confirmOrValue(CONFIRM_VSCODE_MESSAGE, options.vscode);
  const useDocker = options.docker ?? false;

  // Fetch versions
  const versions = await resolveVersions(options.versions);

  console.log(`    version ${colors.rgb8(versions.FRESH_VERSION, 4)}`);
  console.log();

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

  // Collect truly additive variants (docker, vscode)
  const variants: string[] = [];
  if (useVSCode) {
    variants.push("vscode");
  }
  if (useDocker) {
    variants.push("docker");
  }

  // Process template
  await processTemplate(templateDir, variants, projectDir, variables);

  // Fetch and write favicon
  await fetchFavicon(projectDir);

  // Success message
  console.log(
    "\n%cProject initialized!\n",
    "color: green; font-weight: bold",
  );

  if (options.directory !== ".") {
    console.log(
      `Enter your project directory using %ccd ${options.directory}%c.`,
      "color: cyan",
      "",
    );
  }
  console.log(
    "Run %cdeno task dev%c to start the project. %cCTRL-C%c to stop.",
    "color: cyan",
    "",
    "color: cyan",
    "",
  );
  console.log();
  console.log(
    "Stuck? Join our Discord %chttps://discord.gg/deno",
    "color: cyan",
    "",
  );
  console.log();
  console.log("%cHappy hacking! 🦕", "color: gray");
}

/**
 * Resolve all version strings, fetching latest from JSR.
 */
async function resolveVersions(
  overrides?: Partial<typeof DEFAULT_VERSIONS>,
): Promise<
  Omit<
    TemplateVariables,
    keyof {
      PROJECT_NAME: unknown;
      USE_TAILWIND: unknown;
      USE_VSCODE: unknown;
      USE_DOCKER: unknown;
      USE_VITE: unknown;
    }
  >
> {
  const versions = { ...DEFAULT_VERSIONS, ...overrides };

  const [fresh, preact, preactSignals] = await Promise.all([
    getLatestVersion("@fresh/core", versions.fresh),
    getLatestVersion("npm:preact", versions.preact),
    getLatestVersion("npm:@preact/signals", versions.preactSignals),
  ]);

  return {
    FRESH_VERSION: fresh,
    FRESH_TAILWIND_VERSION: versions.freshTailwind,
    FRESH_VITE_PLUGIN_VERSION: versions.freshVitePlugin,
    PREACT_VERSION: preact,
    PREACT_SIGNALS_VERSION: preactSignals,
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
  const variantsDir = path.join(getTemplateDir(), "variants");
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
  const processedName = processFilename(filename);

  // Handle template files: remove .tmpl extension
  const finalName = processedName.endsWith(".tmpl")
    ? processedName.slice(0, -5)
    : processedName;

  const destPath = path.join(destDir, finalName);

  // Handle template files with variable substitution
  if (filename.endsWith(".tmpl")) {
    const content = await Deno.readTextFile(srcPath);
    const transformed = substituteVariables(
      content,
      variables as unknown as Record<string, string | boolean | number>,
    );
    await Deno.writeTextFile(destPath, transformed);
  } else {
    // Copy binary/text files as-is
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
