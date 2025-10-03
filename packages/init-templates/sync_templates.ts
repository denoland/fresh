#!/usr/bin/env -S deno run -A
// deno-lint-ignore-file no-console
/**
 * Sync script for template maintenance.
 *
 * This script copies common files from base templates to their corresponding
 * template variants, making it easier to maintain shared files across templates.
 *
 * Structure:
 * - assets/base/vite/       -> Copied to assets/template/vite/ and vite-tailwind/
 * - assets/base/builder/    -> Copied to assets/template/builder/ and builder-tailwind/
 *
 * Template-specific files (like deno.json.tmpl, styles.css) are never overwritten.
 *
 * Usage:
 *   deno run -A sync_templates.ts
 *   deno run -A sync_templates.ts --dry-run
 */

import * as path from "@std/path";
import * as fs from "@std/fs";
import * as colors from "@std/fmt/colors";

/**
 * Files that should NOT be copied from base to templates.
 * These are template-specific and should be maintained separately.
 */
const TEMPLATE_SPECIFIC_FILES = [
  // Dependency files - different for each template variant
  "deno.json.tmpl",
  "deno.json",

  // Build config - tailwind variants override these
  "vite.config.ts",

  // Styles - different content for tailwind vs regular
  "assets/styles.css",
  "static/styles.css",
];

/**
 * Template configurations.
 */
const TEMPLATE_CONFIG = {
  vite: {
    base: "assets/base/vite",
    targets: ["assets/template/vite", "assets/template/vite-tailwind"],
  },
  builder: {
    base: "assets/base/builder",
    targets: ["assets/template/builder", "assets/template/builder-tailwind"],
  },
};

interface SyncResult {
  copied: string[];
  skipped: string[];
  errors: string[];
}

/**
 * Check if a file path should be skipped (template-specific).
 */
function isTemplateSpecific(relPath: string): boolean {
  return TEMPLATE_SPECIFIC_FILES.some((specific) =>
    relPath === specific || relPath.endsWith(`/${specific}`)
  );
}

/**
 * Recursively copy files from source to destination, skipping template-specific files.
 */
async function syncDirectory(
  srcDir: string,
  destDir: string,
  baseDir: string,
  dryRun: boolean,
): Promise<SyncResult> {
  const result: SyncResult = { copied: [], skipped: [], errors: [] };

  try {
    for await (const entry of Deno.readDir(srcDir)) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      const relPath = path.relative(baseDir, srcPath);

      if (entry.isDirectory) {
        // Recursively sync directories
        if (!dryRun) {
          await fs.ensureDir(destPath);
        }
        const subResult = await syncDirectory(
          srcPath,
          destPath,
          baseDir,
          dryRun,
        );
        result.copied.push(...subResult.copied);
        result.skipped.push(...subResult.skipped);
        result.errors.push(...subResult.errors);
      } else {
        // Check if file is template-specific
        if (isTemplateSpecific(relPath)) {
          result.skipped.push(relPath);
          continue;
        }

        // Copy file
        try {
          if (!dryRun) {
            await fs.copy(srcPath, destPath, { overwrite: true });
          }
          result.copied.push(relPath);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          result.errors.push(`${relPath}: ${message}`);
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.errors.push(`Error reading ${srcDir}: ${message}`);
  }

  return result;
}

/**
 * Sync base template to all its target templates.
 */
async function syncTemplate(
  name: string,
  config: { base: string; targets: string[] },
  dryRun: boolean,
): Promise<void> {
  console.log(colors.bold(colors.cyan(`\n📦 Syncing ${name} templates...`)));
  console.log(colors.dim(`   Base: ${config.base}`));

  for (const target of config.targets) {
    const targetName = path.basename(target);
    console.log(colors.dim(`   → ${targetName}`));

    const result = await syncDirectory(
      config.base,
      target,
      config.base,
      dryRun,
    );

    if (result.copied.length > 0) {
      console.log(
        colors.green(
          `   ✓ ${result.copied.length} file(s) ${
            dryRun ? "would be copied" : "copied"
          }`,
        ),
      );
    }

    if (result.skipped.length > 0) {
      console.log(
        colors.yellow(
          `   ⊘ ${result.skipped.length} file(s) skipped (template-specific)`,
        ),
      );
    }

    if (result.errors.length > 0) {
      console.log(colors.red(`   ✗ ${result.errors.length} error(s):`));
      for (const error of result.errors) {
        console.log(colors.red(`     ${error}`));
      }
    }
  }
}

/**
 * Main sync function.
 */
async function main() {
  const args = Deno.args;
  const dryRun = args.includes("--dry-run");

  console.log(colors.bold("\n🔄 Template Sync Tool\n"));

  if (dryRun) {
    console.log(colors.yellow("🔍 DRY RUN MODE - No files will be modified\n"));
  }

  // Sync all template groups
  for (const [name, config] of Object.entries(TEMPLATE_CONFIG)) {
    await syncTemplate(name, config, dryRun);
  }

  console.log(colors.bold(colors.green("\n✅ Sync complete!")));

  if (dryRun) {
    console.log(
      colors.dim("\nRun without --dry-run to actually copy files."),
    );
  } else {
    console.log(
      colors.dim(
        "\nReview changes with git diff before committing.",
      ),
    );
  }
}

if (import.meta.main) {
  await main();
}
