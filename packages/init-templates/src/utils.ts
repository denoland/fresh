// deno-lint-ignore-file no-console
import * as path from "@std/path";
import * as fs from "@std/fs";
import * as semver from "@std/semver";

/**
 * Fetch the latest version of a package from JSR or npm.
 */
export async function getLatestVersion(
  pkg: string,
  fallback: string,
): Promise<string> {
  try {
    // Check if it's an npm package
    if (pkg.startsWith("npm:")) {
      const npmPkg = pkg.slice(4); // Remove "npm:" prefix
      const res = await fetch(`https://registry.npmjs.org/${npmPkg}/latest`);
      if (!res.ok) {
        await res.body?.cancel();
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json() as { version: string };
      return json.version;
    }

    // JSR package
    const res = await fetch(`https://jsr.io/${pkg}/meta.json`);
    if (!res.ok) {
      await res.body?.cancel(); // Consume the body to avoid leaks
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json() as {
      latest: string | null;
      versions: Record<string, unknown>;
    };

    if (json.latest !== null) {
      return json.latest;
    }

    const versions = Object.keys(json.versions);
    if (versions.length === 0) {
      throw new Error("No versions available");
    }

    versions.sort((a, b) => {
      const s1 = semver.parse(a);
      const s2 = semver.parse(b);
      return semver.compare(s1, s2);
    });

    return versions.at(-1)!;
  } catch (err) {
    // Silent fallback for network or API errors
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `Could not fetch latest ${pkg} version: ${message}. Using fallback: ${fallback}`,
    );
    return fallback;
  }
}

/**
 * Check if a directory exists and is empty (or only contains .git).
 */
export async function isDirectoryEmpty(dir: string): Promise<boolean> {
  try {
    const entries = [];
    for await (const entry of Deno.readDir(dir)) {
      entries.push(entry);
    }
    return entries.length === 0 ||
      (entries.length === 1 && entries[0].name === ".git");
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return true; // Directory doesn't exist, so it's "empty"
    }
    throw err;
  }
}

/**
 * Recursively copy a directory.
 */
export async function copyDir(src: string, dest: string): Promise<void> {
  await fs.ensureDir(dest);

  for await (const entry of Deno.readDir(src)) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copy(srcPath, destPath, { overwrite: true });
    }
  }
}

/**
 * Substitute variables in a template string.
 * Replaces __VAR__ patterns with values.
 */
export function substituteVariables(
  content: string,
  variables: Record<string, string | boolean | number>,
): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`__${key}__`, "g");
    result = result.replace(regex, String(value));
  }

  return result;
}

/**
 * Convert double-underscore-prefixed filename to dot-prefixed.
 * Only converts files/dirs that start with double underscore (__).
 * Files with single underscore (like _app.tsx) are NOT converted.
 * Examples:
 * - "__gitignore" -> ".gitignore"
 * - "__vscode" -> ".vscode"
 * - "_app.tsx" -> "_app.tsx" (unchanged)
 */
export function processFilename(filename: string): string {
  if (filename.startsWith("__")) {
    return "." + filename.slice(2);
  }
  return filename;
}

/**
 * Get the template directory path.
 */
export function getTemplateDir(): string {
  const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
  return path.join(moduleDir, "..", "assets", "template");
}

/**
 * Get the variants directory path.
 */
export function getVariantsDir(): string {
  const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
  return path.join(moduleDir, "..", "assets", "variants");
}

/**
 * Prompt user for confirmation (or use provided value).
 */
export function confirmOrValue(
  message: string,
  providedValue: boolean | undefined,
): boolean {
  if (providedValue !== undefined) {
    return providedValue;
  }
  return confirm(message);
}

/**
 * Prompt user for input (or use provided value).
 */
export function promptOrValue(
  message: string,
  defaultValue: string,
  providedValue: string | undefined,
): string {
  if (providedValue !== undefined) {
    return providedValue;
  }
  const result = prompt(message, defaultValue);
  if (!result) {
    throw new Error("Input required");
  }
  return result;
}
