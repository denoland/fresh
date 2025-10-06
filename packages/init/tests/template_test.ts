import { expect } from "@std/expect";
import * as path from "@std/path";
import { getTemplateDir, getVariantsDir } from "../src/utils.ts";

Deno.test("vite - has all required files", async () => {
  const templateDir = path.join(getTemplateDir(), "vite");

  const requiredFiles = [
    "__gitignore",
    "README.md",
    "deno.json",
    "vite.config.ts",
    "main.ts",
    "client.ts",
    "utils.ts",
    "assets/styles.css",
    "components/Button.tsx",
    "islands/Counter.tsx",
    "routes/index.tsx",
    "routes/_app.tsx",
    "routes/api/[name].tsx",
    "static/logo.svg",
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(templateDir, file);
    const stat = await Deno.stat(filePath);
    expect(stat).toBeTruthy();
    expect(stat.isFile).toBe(true);
  }
});

Deno.test("vite-tailwind - has all required files", async () => {
  const templateDir = path.join(getTemplateDir(), "vite-tailwind");

  const requiredFiles = [
    "__gitignore",
    "README.md",
    "deno.json",
    "vite.config.ts",
    "main.ts",
    "client.ts",
    "utils.ts",
    "assets/styles.css",
    "components/Button.tsx",
    "islands/Counter.tsx",
    "routes/index.tsx",
    "routes/_app.tsx",
    "routes/api/[name].tsx",
    "static/logo.svg",
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(templateDir, file);
    const stat = await Deno.stat(filePath);
    expect(stat).toBeTruthy();
    expect(stat.isFile).toBe(true);
  }
});

Deno.test("builder - has all required files", async () => {
  const templateDir = path.join(getTemplateDir(), "builder");

  const requiredFiles = [
    "__gitignore",
    "README.md",
    "deno.json",
    "dev.ts",
    "main.ts",
    "utils.ts",
    "components/Button.tsx",
    "islands/Counter.tsx",
    "routes/index.tsx",
    "routes/_app.tsx",
    "routes/api/[name].tsx",
    "static/styles.css",
    "static/logo.svg",
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(templateDir, file);
    const stat = await Deno.stat(filePath);
    expect(stat).toBeTruthy();
    expect(stat.isFile).toBe(true);
  }
});

Deno.test("builder-tailwind - has all required files", async () => {
  const templateDir = path.join(getTemplateDir(), "builder-tailwind");

  const requiredFiles = [
    "__gitignore",
    "README.md",
    "deno.json",
    "dev.ts",
    "main.ts",
    "utils.ts",
    "components/Button.tsx",
    "islands/Counter.tsx",
    "routes/index.tsx",
    "routes/_app.tsx",
    "routes/api/[name].tsx",
    "static/styles.css",
    "static/logo.svg",
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(templateDir, file);
    const stat = await Deno.stat(filePath);
    expect(stat).toBeTruthy();
    expect(stat.isFile).toBe(true);
  }
});

Deno.test("vite deno.json - contains template variables", async () => {
  const templateDir = path.join(getTemplateDir(), "vite");
  const denoJsonPath = path.join(templateDir, "deno.json");
  const content = await Deno.readTextFile(denoJsonPath);

  expect(content).toContain("__FRESH_VERSION__");
  expect(content).toContain("__PREACT_VERSION__");
  expect(content).toContain("__PREACT_SIGNALS_VERSION__");
  expect(content).toContain("__VITE_VERSION__");
});

Deno.test("vite-tailwind deno.json - contains Tailwind dependencies", async () => {
  const templateDir = path.join(getTemplateDir(), "vite-tailwind");
  const denoJsonPath = path.join(templateDir, "deno.json");
  const content = await Deno.readTextFile(denoJsonPath);

  expect(content).toContain("__TAILWINDCSS_VERSION__");
  expect(content).toContain("__TAILWINDCSS_VITE_VERSION__");
});

Deno.test("vite-tailwind vite.config.ts - imports Tailwind", async () => {
  const templateDir = path.join(getTemplateDir(), "vite-tailwind");
  const configPath = path.join(templateDir, "vite.config.ts");
  const content = await Deno.readTextFile(configPath);

  expect(content).toContain("@tailwindcss/vite");
  expect(content).toContain("tailwindcss()");
});

Deno.test("vite-tailwind assets/styles.css - uses Tailwind", async () => {
  const templateDir = path.join(getTemplateDir(), "vite-tailwind");
  const cssPath = path.join(templateDir, "assets/styles.css");
  const content = await Deno.readTextFile(cssPath);

  expect(content).toContain('@import "tailwindcss"');
});

Deno.test("builder-tailwind deno.json - contains Tailwind dependencies", async () => {
  const templateDir = path.join(getTemplateDir(), "builder-tailwind");
  const denoJsonPath = path.join(templateDir, "deno.json");
  const content = await Deno.readTextFile(denoJsonPath);

  expect(content).toContain("__TAILWINDCSS_VERSION__");
  expect(content).toContain("__FRESH_TAILWIND_VERSION__");
});

Deno.test("builder-tailwind static/styles.css - uses Tailwind", async () => {
  const templateDir = path.join(getTemplateDir(), "builder-tailwind");
  const cssPath = path.join(templateDir, "static/styles.css");
  const content = await Deno.readTextFile(cssPath);

  expect(content).toContain('@import "tailwindcss"');
});

Deno.test("vite _app.tsx - contains PROJECT_NAME variable", async () => {
  const templateDir = path.join(getTemplateDir(), "vite");
  const appPath = path.join(templateDir, "routes/_app.tsx");
  const content = await Deno.readTextFile(appPath);

  expect(content).toContain("__PROJECT_NAME__");
});

Deno.test("variants/docker - has Dockerfile", async () => {
  const variantDir = path.join(getVariantsDir(), "docker");
  const dockerfilePath = path.join(variantDir, "Dockerfile");

  const stat = await Deno.stat(dockerfilePath);
  expect(stat).toBeTruthy();
  expect(stat.isFile).toBe(true);

  const content = await Deno.readTextFile(dockerfilePath);
  expect(content).toContain("__DENO_VERSION__");
});

Deno.test("variants/vscode - has required files", async () => {
  const variantDir = path.join(getVariantsDir(), "vscode");

  const requiredFiles = [
    "__vscode/settings.json",
    "__vscode/extensions.json",
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(variantDir, file);
    const stat = await Deno.stat(filePath);
    expect(stat).toBeTruthy();
    expect(stat.isFile).toBe(true);
  }
});

Deno.test("variants/vscode-tailwind - has tailwind.json", async () => {
  const variantDir = path.join(getVariantsDir(), "vscode-tailwind");
  const tailwindJsonPath = path.join(variantDir, "__vscode/tailwind.json");

  const stat = await Deno.stat(tailwindJsonPath);
  expect(stat).toBeTruthy();
  expect(stat.isFile).toBe(true);

  // Check content
  const content = JSON.parse(await Deno.readTextFile(tailwindJsonPath));
  expect(content.version).toBe(1.1);
  expect(content.atDirectives).toBeTruthy();
  expect(content.atDirectives.length).toBeGreaterThan(0);
  expect(content.atDirectives[0].name).toBe("@tailwind");
});
