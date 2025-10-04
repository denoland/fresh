import { expect } from "@std/expect";
import * as path from "@std/path";

Deno.test({
  name: "cli - shows help text",
  async fn() {
    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "-A",
        path.join(import.meta.dirname!, "..", "cli.ts"),
        "--help",
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await command.output();
    const output = new TextDecoder().decode(stdout);

    expect(code).toBe(0);
    expect(output).toContain("@fresh/init");
    expect(output).toContain("USAGE:");
    expect(output).toContain("OPTIONS:");
    expect(output).toContain("--force");
    expect(output).toContain("--tailwind");
    expect(output).toContain("--vscode");
    expect(output).toContain("--docker");
    expect(output).toContain("--builder");
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "cli - creates project with flags",
  async fn() {
    const tmpDir = await Deno.makeTempDir();
    const projectName = "test-cli-full";

    try {
      const command = new Deno.Command(Deno.execPath(), {
        args: [
          "run",
          "-A",
          path.join(import.meta.dirname!, "..", "cli.ts"),
          projectName,
          "--force",
          "--tailwind",
          "--vscode",
        ],
        cwd: tmpDir,
        stdout: "piped",
        stderr: "piped",
      });

      const { code, stdout } = await command.output();
      const output = new TextDecoder().decode(stdout);

      expect(code).toBe(0);
      expect(output).toContain("Project initialized!");

      // Verify project structure
      const projectDir = path.join(tmpDir, projectName);
      const stat = await Deno.stat(projectDir);
      expect(stat.isDirectory).toBe(true);

      // Verify key files exist
      await Deno.stat(path.join(projectDir, "deno.json"));
      await Deno.stat(path.join(projectDir, "vite.config.ts"));
      await Deno.stat(path.join(projectDir, "assets", "styles.css"));
      await Deno.stat(path.join(projectDir, ".vscode", "settings.json"));
      await Deno.stat(path.join(projectDir, ".vscode", "tailwind.json"));
    } finally {
      await Deno.remove(tmpDir, { recursive: true });
    }
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "cli - creates builder project",
  async fn() {
    const tmpDir = await Deno.makeTempDir();
    const projectName = "test-cli-builder";

    try {
      const command = new Deno.Command(Deno.execPath(), {
        args: [
          "run",
          "-A",
          path.join(import.meta.dirname!, "..", "cli.ts"),
          projectName,
          "--force",
          "--builder",
          "--docker",
        ],
        cwd: tmpDir,
        stdout: "piped",
        stderr: "piped",
        stdin: "null",
        env: {
          "NO_COLOR": "1", // Disable prompts in test
        },
      });

      const { code } = await command.output();
      expect(code).toBe(0);

      // Verify builder project structure
      const projectDir = path.join(tmpDir, projectName);
      await Deno.stat(path.join(projectDir, "dev.ts"));
      await Deno.stat(path.join(projectDir, "Dockerfile"));

      // Should NOT have vite files
      try {
        await Deno.stat(path.join(projectDir, "vite.config.ts"));
        throw new Error("Should not have vite.config.ts in builder mode");
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
      }
    } finally {
      await Deno.remove(tmpDir, { recursive: true });
    }
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
