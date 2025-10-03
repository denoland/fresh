import { assertEquals } from "@std/assert";
import * as path from "@std/path";
import { initProject } from "../src/init.ts";
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

Deno.test({
  name: "integration - vite project passes check",
  ignore: false,
  async fn() {
    await using tmp = await withTmpDir();
    const projectDir = path.join(tmp.dir, "test-vite-check");

    await initProject(tmp.dir, {
      directory: "test-vite-check",
      builder: false,
      tailwind: false,
      vscode: false,
      docker: false,
      force: true,
      versions: { fresh: "2.1.1" },
    });

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

    await initProject(tmp.dir, {
      directory: "test-builder-check",
      builder: true,
      tailwind: false,
      vscode: false,
      docker: false,
      force: true,
      versions: { fresh: "2.1.1" },
    });

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

    await initProject(tmp.dir, {
      directory: "test-vite-tailwind-check",
      builder: false,
      tailwind: true,
      vscode: false,
      docker: false,
      force: true,
      versions: { fresh: "2.1.1" },
    });

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

    await initProject(tmp.dir, {
      directory: "test-vite-build",
      builder: false,
      tailwind: false,
      vscode: false,
      docker: false,
      force: true,
      versions: { fresh: "2.1.1" },
    });

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

    await initProject(tmp.dir, {
      directory: "test-builder-build",
      builder: true,
      tailwind: false,
      vscode: false,
      docker: false,
      force: true,
      versions: { fresh: "2.1.1" },
    });

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
  name: "integration - dev server starts successfully",
  ignore: false,
  async fn() {
    await using tmp = await withTmpDir();
    const projectDir = path.join(tmp.dir, "test-dev-server");

    await initProject(tmp.dir, {
      directory: "test-dev-server",
      builder: false,
      tailwind: false,
      vscode: false,
      docker: false,
      force: true,
      versions: { fresh: "2.1.1" },
    });

    // Start dev server and verify it responds
    await withChildProcessServer(
      {
        cwd: projectDir,
        args: ["task", "dev"],
      },
      async (address) => {
        // Verify the server responds
        const res = await fetch(address);
        assertEquals(res.status, 200);
      },
    );
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
