/**
 * Compatibility tests that compare the output of the old init script
 * (jsr:@fresh/init@2.0.9) with the new template-based init script
 * to ensure 100% identical output for various option combinations.
 */
import { expect } from "@std/expect";
import * as path from "@std/path";
import * as fs from "@std/fs";
import { stub } from "@std/testing/mock";
import { initProject as newInitProject, resolveVersions } from "../src/init.ts";
import { withTmpDir } from "../../fresh/src/test_utils.ts";

/**
 * Recursively get all files in a directory with their relative paths
 */
async function getAllFiles(dir: string, baseDir = dir): Promise<string[]> {
  const files: string[] = [];

  for await (const entry of fs.walk(dir, { includeFiles: true })) {
    if (entry.isFile) {
      const relativePath = path.relative(baseDir, entry.path);
      files.push(relativePath);
    }
  }

  return files.sort();
}

/**
 * Compare two directories recursively, ensuring all files and contents match
 */
async function compareDirectories(
  dir1: string,
  dir2: string,
  description: string,
): Promise<void> {
  const files1 = await getAllFiles(dir1);
  const files2 = await getAllFiles(dir2);

  // Compare file lists
  expect(files1).toEqual(files2);

  // Compare file contents
  for (const file of files1) {
    const file1Path = path.join(dir1, file);
    const file2Path = path.join(dir2, file);

    let content1 = await Deno.readTextFile(file1Path);
    let content2 = await Deno.readTextFile(file2Path);

    // For deno.json, normalize dependency versions to allow minor/patch differences
    // The new init fetches latest compatible versions from network, which may differ
    // from hardcoded versions in old init. This is expected and acceptable behavior.
    if (file === "deno.json") {
      content1 = normalizeDependencyVersions(content1);
      content2 = normalizeDependencyVersions(content2);
    }

    if (content1 !== content2) {
      console.error(`\nFile mismatch in ${description}: ${file}`);
      console.error(`Old init: ${file1Path}`);
      console.error(`New init: ${file2Path}`);
      console.error("\n--- Expected (old init) ---");
      console.error(content1.slice(0, 500));
      console.error("\n--- Actual (new init) ---");
      console.error(content2.slice(0, 500));
    }

    expect(content2).toBe(content1);
  }
}

/**
 * Normalize dependency versions in deno.json to allow minor/patch differences.
 * Replaces specific version numbers with major version only for comparison.
 */
function normalizeDependencyVersions(content: string): string {
  return content
    // Normalize preact signals version (2.3.x -> 2.x)
    .replace(
      /"npm:@preact\/signals@\^2\.\d+\.\d+"/g,
      '"npm:@preact/signals@^2.x"',
    )
    // Normalize preact version (10.x.x -> 10.x)
    .replace(/"npm:preact@\^10\.\d+\.\d+"/g, '"npm:preact@^10.x"')
    // Normalize fresh/plugin-vite version (1.0.x -> 1.0)
    .replace(
      /"jsr:@fresh\/plugin-vite@\^1\.0\.\d+"/g,
      '"jsr:@fresh/plugin-vite@^1.0"',
    );
}

/**
 * Run the old init script from JSR using the CLI
 */
async function runOldInit(
  dir: string,
  projectName: string,
  flags: {
    docker?: boolean;
    tailwind?: boolean;
    vscode?: boolean;
    builder?: boolean;
  },
): Promise<void> {
  const args = [
    "run",
    "-A",
    "jsr:@fresh/init@2.0.9",
    projectName,
    "--force",
  ];

  if (flags.builder) args.push("--builder");
  if (flags.tailwind) args.push("--tailwind");
  if (flags.vscode) args.push("--vscode");
  if (flags.docker) args.push("--docker");

  const command = new Deno.Command("deno", {
    args,
    cwd: dir,
    stdout: "null",
    stderr: "null",
  });

  const { success } = await command.output();
  if (!success) {
    throw new Error("Old init script failed");
  }
}

/**
 * Test helper that runs both old and new init scripts with the same options
 * and compares the output
 */
async function testCompatibility(
  testName: string,
  flags: {
    docker?: boolean;
    tailwind?: boolean;
    vscode?: boolean;
    builder?: boolean;
  },
): Promise<void> {
  // Use temporary directories for both tests
  await using tmpOld = await withTmpDir();
  await using tmpNew = await withTmpDir();

  const projectName = "test-project";

  // Stub console.log to suppress init output
  using _logs = stub(console, "log", () => undefined);

  // Stub prompt and confirm to prevent waiting for user input
  using _promptStub = stub(globalThis, "prompt", () => projectName);
  using _confirmStub = stub(globalThis, "confirm", () => false);

  // Run old init script from JSR using CLI
  await runOldInit(tmpOld.dir, projectName, flags);

  // Resolve versions to match what the old init would use
  const versions = await resolveVersions({
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
  });

  // Run new init script
  await newInitProject(
    tmpNew.dir,
    {
      directory: projectName,
      builder: flags.builder ?? false,
      tailwind: flags.tailwind ?? false,
      vscode: flags.vscode ?? false,
      docker: flags.docker ?? false,
      force: true,
    },
    versions,
  );

  // Compare the outputs
  const oldProjectDir = path.join(tmpOld.dir, projectName);
  const newProjectDir = path.join(tmpNew.dir, projectName);
  await compareDirectories(oldProjectDir, newProjectDir, testName);
}

// Test suite covering major option combinations

Deno.test({
  name: "compatibility - default (builder, no extras)",
  async fn() {
    await testCompatibility("default", {
      builder: true,
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "compatibility - vite only",
  async fn() {
    await testCompatibility("vite", {
      builder: false,
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "compatibility - vite + tailwind",
  async fn() {
    await testCompatibility("vite-tailwind", {
      builder: false,
      tailwind: true,
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "compatibility - builder + tailwind",
  async fn() {
    await testCompatibility("builder-tailwind", {
      builder: true,
      tailwind: true,
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "compatibility - vite + vscode",
  async fn() {
    await testCompatibility("vite-vscode", {
      builder: false,
      vscode: true,
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "compatibility - vite + docker",
  async fn() {
    await testCompatibility("vite-docker", {
      builder: false,
      docker: true,
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "compatibility - vite + tailwind + vscode",
  async fn() {
    await testCompatibility("vite-tailwind-vscode", {
      builder: false,
      tailwind: true,
      vscode: true,
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "compatibility - builder + tailwind + docker",
  async fn() {
    await testCompatibility("builder-tailwind-docker", {
      builder: true,
      tailwind: true,
      docker: true,
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "compatibility - vite + all extras",
  async fn() {
    await testCompatibility("vite-all", {
      builder: false,
      tailwind: true,
      vscode: true,
      docker: true,
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "compatibility - builder + all extras",
  async fn() {
    await testCompatibility("builder-all", {
      builder: true,
      tailwind: true,
      vscode: true,
      docker: true,
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
