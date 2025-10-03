import { expect } from "@std/expect";
import * as path from "@std/path";
import { withTmpDir } from "../../fresh/src/test_utils.ts";
import { initProject, resolveVersions } from "../src/init.ts";

Deno.test("initProject - creates vite project with default options", async () => {
  await using tmp = await withTmpDir();
  const projectDir = path.join(tmp.dir, "test-project");

  const versions = await resolveVersions({
    fresh: "2.1.1",
    preact: "10.27.2",
  });

  await initProject(tmp.dir, {
    directory: "test-project",
    builder: false,
    tailwind: false,
    vscode: false,
    docker: false,
    force: true,
  }, versions);

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
    expect(stat.isFile).toBe(true);
  }

  // Check that deno.json contains correct version
  const denoJson = JSON.parse(
    await Deno.readTextFile(path.join(projectDir, "deno.json")),
  );
  expect(denoJson.imports.fresh).toContain("2.1.1");
  expect(denoJson.imports.preact).toContain("10.27.2");

  // Check that vite.config.ts doesn't include tailwind
  const viteConfig = await Deno.readTextFile(
    path.join(projectDir, "vite.config.ts"),
  );
  expect(viteConfig).not.toContain("tailwindcss");

  // Check that _app.tsx has project name
  const appFile = await Deno.readTextFile(
    path.join(projectDir, "routes/_app.tsx"),
  );
  expect(appFile).toContain("test-project");
});

Deno.test("initProject - creates vite project with tailwind", async () => {
  await using tmp = await withTmpDir();
  const projectDir = path.join(tmp.dir, "test-tailwind");

  const versions = await resolveVersions({ fresh: "2.1.1" });

  await initProject(tmp.dir, {
    directory: "test-tailwind",
    builder: false,
    tailwind: true,
    vscode: false,
    docker: false,
    force: true,
  }, versions);

  // Check vite.config.ts includes tailwind
  const viteConfig = await Deno.readTextFile(
    path.join(projectDir, "vite.config.ts"),
  );
  expect(viteConfig).toContain("tailwindcss");
  expect(viteConfig).toContain("@tailwindcss/vite");

  // Check deno.json includes tailwind
  const denoJson = JSON.parse(
    await Deno.readTextFile(path.join(projectDir, "deno.json")),
  );
  expect(denoJson.imports.tailwindcss).toBeTruthy();
  expect(denoJson.imports["@tailwindcss/vite"]).toBeTruthy();

  // Check styles.css uses @import
  const styles = await Deno.readTextFile(
    path.join(projectDir, "assets/styles.css"),
  );
  expect(styles).toContain("@import");
});

Deno.test("initProject - creates builder project", async () => {
  await using tmp = await withTmpDir();
  const projectDir = path.join(tmp.dir, "test-builder");

  const versions = await resolveVersions({ fresh: "2.1.1" });

  await initProject(tmp.dir, {
    directory: "test-builder",
    builder: true,
    tailwind: false,
    vscode: false,
    docker: false,
    force: true,
  }, versions);

  // Check that dev.ts exists (not vite.config.ts)
  const devTsPath = path.join(projectDir, "dev.ts");
  const vitePath = path.join(projectDir, "vite.config.ts");

  const devStat = await Deno.stat(devTsPath);
  expect(devStat.isFile).toBe(true);

  try {
    await Deno.stat(vitePath);
    throw new Error("vite.config.ts should not exist in builder mode");
  } catch (err) {
    expect(err).toBeInstanceOf(Deno.errors.NotFound);
  }

  // Check that static/styles.css exists (not assets/)
  const stylesPath = path.join(projectDir, "static/styles.css");
  const stylesStat = await Deno.stat(stylesPath);
  expect(stylesStat.isFile).toBe(true);

  // Check that _app.tsx has link to styles.css
  const appFile = await Deno.readTextFile(
    path.join(projectDir, "routes/_app.tsx"),
  );
  expect(appFile).toContain('href="/styles.css"');
});

Deno.test("initProject - creates project with vscode settings", async () => {
  await using tmp = await withTmpDir();
  const projectDir = path.join(tmp.dir, "test-vscode");

  const versions = await resolveVersions({ fresh: "2.1.1" });

  await initProject(tmp.dir, {
    directory: "test-vscode",
    builder: false,
    tailwind: false,
    vscode: true,
    docker: false,
    force: true,
  }, versions);

  // Check VS Code files exist
  const vscodeFiles = [
    ".vscode/settings.json",
    ".vscode/extensions.json",
  ];

  for (const file of vscodeFiles) {
    const filePath = path.join(projectDir, file);
    const stat = await Deno.stat(filePath);
    expect(stat.isFile).toBe(true);
  }

  // Check settings.json content
  const settings = JSON.parse(
    await Deno.readTextFile(path.join(projectDir, ".vscode/settings.json")),
  );
  expect(settings["deno.enable"]).toBe(true);
  expect(settings["deno.lint"]).toBe(true);

  // Check extensions.json content
  const extensions = JSON.parse(
    await Deno.readTextFile(
      path.join(projectDir, ".vscode/extensions.json"),
    ),
  );
  expect(extensions.recommendations).toContain("denoland.vscode-deno");
});

Deno.test("initProject - creates project with docker", async () => {
  await using tmp = await withTmpDir();
  const projectDir = path.join(tmp.dir, "test-docker");

  const versions = await resolveVersions({ fresh: "2.1.1" });

  await initProject(tmp.dir, {
    directory: "test-docker",
    builder: false,
    tailwind: false,
    vscode: false,
    docker: true,
    force: true,
  }, versions);

  // Check Dockerfile exists
  const dockerfilePath = path.join(projectDir, "Dockerfile");
  const dockerStat = await Deno.stat(dockerfilePath);
  expect(dockerStat.isFile).toBe(true);

  // Check Dockerfile content
  const dockerfile = await Deno.readTextFile(dockerfilePath);
  expect(dockerfile).toContain("FROM denoland/deno");
  expect(dockerfile).toContain("EXPOSE 8000");
});

Deno.test(
  "initProject - creates tailwind.json when vscode + tailwind",
  async () => {
    await using tmp = await withTmpDir();
    const projectDir = path.join(tmp.dir, "test-vscode-tailwind");

    const versions = await resolveVersions({ fresh: "2.1.1" });

    await initProject(tmp.dir, {
      directory: "test-vscode-tailwind",
      builder: false,
      tailwind: true,
      vscode: true,
      docker: false,
      force: true,
    }, versions);

    // Check .vscode/tailwind.json exists
    const tailwindJsonPath = path.join(
      projectDir,
      ".vscode/tailwind.json",
    );
    const tailwindStat = await Deno.stat(tailwindJsonPath);
    expect(tailwindStat.isFile).toBe(true);

    // Check tailwind.json content
    const tailwindJson = JSON.parse(
      await Deno.readTextFile(tailwindJsonPath),
    );
    expect(tailwindJson.version).toBe(1.1);
    expect(tailwindJson.atDirectives).toBeTruthy();
    expect(tailwindJson.atDirectives.length).toBeGreaterThan(0);
    expect(tailwindJson.atDirectives[0].name).toBe("@tailwind");
  },
);
