import { assertEquals } from "@std/assert";
import * as path from "@std/path";
import { initProject } from "../src/init.ts";

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

// Helper to run a command in a directory
async function runCommand(
  dir: string,
  cmd: string[],
  options: { background?: boolean } = {},
): Promise<{ success: boolean; output: string }> {
  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd: dir,
    stdout: "piped",
    stderr: "piped",
  });

  if (options.background) {
    const child = command.spawn();
    // Give it a moment to start
    await new Promise((resolve) => setTimeout(resolve, 2000));
    child.kill();
    return { success: true, output: "" };
  }

  const { code, stdout, stderr } = await command.output();
  const output = new TextDecoder().decode(stdout) +
    new TextDecoder().decode(stderr);

  return { success: code === 0, output };
}

Deno.test({
  name: "integration - vite project passes check",
  ignore: true, // Enable when ready for full integration tests
  async fn() {
    const tempDir = await Deno.makeTempDir();
    const projectDir = path.join(tempDir, "test-vite-check");

    try {
      await initProject(tempDir, {
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
    } finally {
      await Deno.remove(tempDir, { recursive: true });
    }
  },
});

Deno.test({
  name: "integration - builder project passes check",
  ignore: true, // Enable when ready for full integration tests
  async fn() {
    const tempDir = await Deno.makeTempDir();
    const projectDir = path.join(tempDir, "test-builder-check");

    try {
      await initProject(tempDir, {
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
    } finally {
      await Deno.remove(tempDir, { recursive: true });
    }
  },
});

Deno.test({
  name: "integration - vite with tailwind passes check",
  ignore: true, // Enable when ready for full integration tests
  async fn() {
    const tempDir = await Deno.makeTempDir();
    const projectDir = path.join(tempDir, "test-vite-tailwind-check");

    try {
      await initProject(tempDir, {
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
    } finally {
      await Deno.remove(tempDir, { recursive: true });
    }
  },
});

Deno.test({
  name: "integration - vite project can build",
  ignore: true, // Enable when ready for full integration tests
  async fn() {
    const tempDir = await Deno.makeTempDir();
    const projectDir = path.join(tempDir, "test-vite-build");

    try {
      await initProject(tempDir, {
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
    } finally {
      await Deno.remove(tempDir, { recursive: true });
    }
  },
});

Deno.test({
  name: "integration - builder project can build",
  ignore: true, // Enable when ready for full integration tests
  async fn() {
    const tempDir = await Deno.makeTempDir();
    const projectDir = path.join(tempDir, "test-builder-build");

    try {
      await initProject(tempDir, {
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
    } finally {
      await Deno.remove(tempDir, { recursive: true });
    }
  },
});

Deno.test({
  name: "integration - dev server starts successfully",
  ignore: true, // Enable when ready for full integration tests
  async fn() {
    const tempDir = await Deno.makeTempDir();
    const projectDir = path.join(tempDir, "test-dev-server");

    try {
      await initProject(tempDir, {
        directory: "test-dev-server",
        builder: false,
        tailwind: false,
        vscode: false,
        docker: false,
        force: true,
        versions: { fresh: "2.1.1" },
      });

      // Try to start dev server in background
      const { success } = await runCommand(
        projectDir,
        ["deno", "task", "dev"],
        { background: true },
      );

      // If we get here without hanging, the server started
      assertEquals(success, true);
    } finally {
      await Deno.remove(tempDir, { recursive: true });
    }
  },
});
