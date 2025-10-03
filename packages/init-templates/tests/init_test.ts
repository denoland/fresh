import { assertEquals, assertExists } from "@std/assert";
import * as path from "@std/path";
import { initProject } from "../src/init.ts";

Deno.test("initProject - creates vite project with default options", async () => {
  const tempDir = await Deno.makeTempDir();
  const projectDir = path.join(tempDir, "test-project");

  try {
    await initProject(tempDir, {
      directory: "test-project",
      builder: false,
      tailwind: false,
      vscode: false,
      docker: false,
      force: true,
      versions: {
        fresh: "2.1.1",
        preact: "10.27.2",
      },
    });

    // Check that key files exist
    const files = [
      "deno.json",
      "vite.config.ts",
      "main.ts",
      "client.ts",
      "utils.ts",
      "README.md",
      ".gitignore",
      "routes/index.tsx",
      "routes/_app.tsx",
      "routes/api/[name].tsx",
      "islands/Counter.tsx",
      "components/Button.tsx",
      "assets/styles.css",
      "static/logo.svg",
      // favicon.ico might not exist if network fails, so skip checking it
    ];

    for (const file of files) {
      const filePath = path.join(projectDir, file);
      const stat = await Deno.stat(filePath);
      assertExists(stat, `File should exist: ${file}`);
    }

    // Check that deno.json contains correct version
    const denoJson = JSON.parse(
      await Deno.readTextFile(path.join(projectDir, "deno.json")),
    );
    assertEquals(denoJson.imports.fresh.includes("2.1.1"), true);
    assertEquals(denoJson.imports.preact.includes("10.27.2"), true);

    // Check that vite.config.ts doesn't include tailwind
    const viteConfig = await Deno.readTextFile(
      path.join(projectDir, "vite.config.ts"),
    );
    assertEquals(viteConfig.includes("tailwindcss"), false);

    // Check that _app.tsx has project name
    const appFile = await Deno.readTextFile(
      path.join(projectDir, "routes/_app.tsx"),
    );
    assertEquals(appFile.includes("test-project"), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("initProject - creates vite project with tailwind", async () => {
  const tempDir = await Deno.makeTempDir();
  const projectDir = path.join(tempDir, "test-tailwind");

  try {
    await initProject(tempDir, {
      directory: "test-tailwind",
      builder: false,
      tailwind: true,
      vscode: false,
      docker: false,
      force: true,
      versions: { fresh: "2.1.1" },
    });

    // Check vite.config.ts includes tailwind
    const viteConfig = await Deno.readTextFile(
      path.join(projectDir, "vite.config.ts"),
    );
    assertEquals(viteConfig.includes("tailwindcss"), true);
    assertEquals(viteConfig.includes("@tailwindcss/vite"), true);

    // Check deno.json includes tailwind
    const denoJson = JSON.parse(
      await Deno.readTextFile(path.join(projectDir, "deno.json")),
    );
    assertExists(denoJson.imports.tailwindcss);
    assertExists(denoJson.imports["@tailwindcss/vite"]);

    // Check styles.css uses @import
    const styles = await Deno.readTextFile(
      path.join(projectDir, "assets/styles.css"),
    );
    assertEquals(styles.includes("@import"), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("initProject - creates builder project", async () => {
  const tempDir = await Deno.makeTempDir();
  const projectDir = path.join(tempDir, "test-builder");

  try {
    await initProject(tempDir, {
      directory: "test-builder",
      builder: true,
      tailwind: false,
      vscode: false,
      docker: false,
      force: true,
      versions: { fresh: "2.1.1" },
    });

    // Check that dev.ts exists (not vite.config.ts)
    const devTsPath = path.join(projectDir, "dev.ts");
    const vitePath = path.join(projectDir, "vite.config.ts");

    assertExists(await Deno.stat(devTsPath));

    try {
      await Deno.stat(vitePath);
      throw new Error("vite.config.ts should not exist in builder mode");
    } catch (err) {
      assertEquals(err instanceof Deno.errors.NotFound, true);
    }

    // Check that static/styles.css exists (not assets/)
    const stylesPath = path.join(projectDir, "static/styles.css");
    assertExists(await Deno.stat(stylesPath));

    // Check that _app.tsx has link to styles.css
    const appFile = await Deno.readTextFile(
      path.join(projectDir, "routes/_app.tsx"),
    );
    assertEquals(appFile.includes('href="/styles.css"'), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("initProject - creates project with vscode settings", async () => {
  const tempDir = await Deno.makeTempDir();
  const projectDir = path.join(tempDir, "test-vscode");

  try {
    await initProject(tempDir, {
      directory: "test-vscode",
      builder: false,
      tailwind: false,
      vscode: true,
      docker: false,
      force: true,
      versions: { fresh: "2.1.1" },
    });

    // Check VS Code files exist
    const vscodeFiles = [
      ".vscode/settings.json",
      ".vscode/extensions.json",
    ];

    for (const file of vscodeFiles) {
      const filePath = path.join(projectDir, file);
      assertExists(await Deno.stat(filePath));
    }

    // Check settings.json content
    const settings = JSON.parse(
      await Deno.readTextFile(path.join(projectDir, ".vscode/settings.json")),
    );
    assertEquals(settings["deno.enable"], true);
    assertEquals(settings["deno.lint"], true);

    // Check extensions.json content
    const extensions = JSON.parse(
      await Deno.readTextFile(
        path.join(projectDir, ".vscode/extensions.json"),
      ),
    );
    assertEquals(
      extensions.recommendations.includes("denoland.vscode-deno"),
      true,
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("initProject - creates project with docker", async () => {
  const tempDir = await Deno.makeTempDir();
  const projectDir = path.join(tempDir, "test-docker");

  try {
    await initProject(tempDir, {
      directory: "test-docker",
      builder: false,
      tailwind: false,
      vscode: false,
      docker: true,
      force: true,
      versions: { fresh: "2.1.1" },
    });

    // Check Dockerfile exists
    const dockerfilePath = path.join(projectDir, "Dockerfile");
    assertExists(await Deno.stat(dockerfilePath));

    // Check Dockerfile content
    const dockerfile = await Deno.readTextFile(dockerfilePath);
    assertEquals(dockerfile.includes("FROM denoland/deno"), true);
    assertEquals(dockerfile.includes("EXPOSE 8000"), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
