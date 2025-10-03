import { assertEquals } from "@std/assert";
import * as path from "@std/path";
import { initProject, resolveVersions } from "../src/init.ts";
import { withTmpDir } from "../../fresh/src/test_utils.ts";
import { withChildProcessServer } from "../../fresh/tests/test_utils.tsx";

/**
 * Integration tests for validating generated projects.
 *
 * These tests generate complete projects and verify they work correctly:
 * - Project files are valid and can be checked with `deno task check`
 * - Development server starts successfully with `deno task dev`
 * - Production build completes with `deno task build`
 *
 * Note: These tests are more extensive and slower than unit tests.
 * They should be run less frequently, perhaps in CI or before releases.
 */

// Helper to run a command in a directory and check its exit code
async function runCommand(
  dir: string,
  cmd: string[],
): Promise<{ success: boolean; output: string }> {
  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd: dir,
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();
  const output = new TextDecoder().decode(stdout) +
    new TextDecoder().decode(stderr);

  return { success: code === 0, output };
}

// Helper to initialize a project with resolved versions (for tests)
async function initTestProject(
  cwd: string,
  directory: string,
  builder: boolean,
  tailwind: boolean,
) {
  const versions = await resolveVersions({ fresh: "2.1.1" });
  await initProject(cwd, {
    directory,
    builder,
    tailwind,
    vscode: false,
    docker: false,
    force: true,
  }, versions);
}

Deno.test({
  name: "integration - vite project passes check",
  ignore: false,
  async fn() {
    await using tmp = await withTmpDir();
    const projectDir = path.join(tmp.dir, "test-vite-check");

    await initTestProject(tmp.dir, "test-vite-check", false, false);

    const { success, output } = await runCommand(
      projectDir,
      ["deno", "task", "check"],
    );

    assertEquals(success, true, `Check failed: ${output}`);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "integration - builder project passes check",
  ignore: false,
  async fn() {
    await using tmp = await withTmpDir();
    const projectDir = path.join(tmp.dir, "test-builder-check");

    await initTestProject(tmp.dir, "test-builder-check", true, false);

    const { success, output } = await runCommand(
      projectDir,
      ["deno", "task", "check"],
    );

    assertEquals(success, true, `Check failed: ${output}`);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "integration - vite with tailwind passes check",
  ignore: false,
  async fn() {
    await using tmp = await withTmpDir();
    const projectDir = path.join(tmp.dir, "test-vite-tailwind-check");

    await initTestProject(tmp.dir, "test-vite-tailwind-check", false, true);

    const { success, output } = await runCommand(
      projectDir,
      ["deno", "task", "check"],
    );

    assertEquals(success, true, `Check failed: ${output}`);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "integration - vite project can build",
  ignore: false,
  async fn() {
    await using tmp = await withTmpDir();
    const projectDir = path.join(tmp.dir, "test-vite-build");

    await initTestProject(tmp.dir, "test-vite-build", false, false);

    // Install dependencies first
    await runCommand(projectDir, ["deno", "install"]);

    const { success, output } = await runCommand(
      projectDir,
      ["deno", "task", "build"],
    );

    assertEquals(success, true, `Build failed: ${output}`);

    // Check that _fresh directory was created
    const freshDir = path.join(projectDir, "_fresh");
    const stat = await Deno.stat(freshDir);
    assertEquals(stat.isDirectory, true);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "integration - builder project can build",
  ignore: false,
  async fn() {
    await using tmp = await withTmpDir();
    const projectDir = path.join(tmp.dir, "test-builder-build");

    await initTestProject(tmp.dir, "test-builder-build", true, false);

    const { success, output } = await runCommand(
      projectDir,
      ["deno", "task", "build"],
    );

    assertEquals(success, true, `Build failed: ${output}`);

    // Check that _fresh directory was created
    const freshDir = path.join(projectDir, "_fresh");
    const stat = await Deno.stat(freshDir);
    assertEquals(stat.isDirectory, true);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "integration - vite dev server works",
  ignore: false,
  async fn() {
    await using tmp = await withTmpDir();
    const projectDir = path.join(tmp.dir, "test-dev-server");

    await initTestProject(tmp.dir, "test-dev-server", false, false);

    // Start dev server and verify it works
    await withChildProcessServer(
      {
        cwd: projectDir,
        args: ["task", "dev"],
      },
      async (address) => {
        // Verify the home page responds with correct content
        const res = await fetch(address);
        assertEquals(res.status, 200);

        const html = await res.text();
        // Check for Fresh welcome message
        assertEquals(
          html.includes("Welcome to Fresh"),
          true,
          "Fresh welcome message should appear",
        );
        // Check for counter island
        assertEquals(
          html.includes("Counter"),
          true,
          "Counter island should be present",
        );
        // Check for logo
        assertEquals(
          html.includes("logo.svg"),
          true,
          "Fresh logo should be present",
        );

        // Test the API route
        const apiRes = await fetch(`${address}/api/fresh`);
        assertEquals(apiRes.status, 200);
        const greeting = await apiRes.text();
        assertEquals(greeting, "Hello, Fresh!", "API should return greeting");
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "integration - builder dev server works",
  ignore: false,
  async fn() {
    await using tmp = await withTmpDir();
    const projectDir = path.join(tmp.dir, "test-builder-dev");

    await initTestProject(tmp.dir, "test-builder-dev", true, false);

    // Start dev server and verify it works
    await withChildProcessServer(
      {
        cwd: projectDir,
        args: ["task", "dev"],
      },
      async (address) => {
        // Verify the home page responds with correct content
        const res = await fetch(address);
        assertEquals(res.status, 200);

        const html = await res.text();
        // Check for Fresh welcome message
        assertEquals(
          html.includes("Welcome to Fresh"),
          true,
          "Fresh welcome message should appear",
        );
        // Check for counter island
        assertEquals(
          html.includes("Counter"),
          true,
          "Counter island should be present",
        );
        // Check for logo
        assertEquals(
          html.includes("logo.svg"),
          true,
          "Fresh logo should be present",
        );

        // Test the API route
        const apiRes = await fetch(`${address}/api/fresh`);
        assertEquals(apiRes.status, 200);
        const greeting = await apiRes.text();
        assertEquals(greeting, "Hello, Fresh!", "API should return greeting");
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
