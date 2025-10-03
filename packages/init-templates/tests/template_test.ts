import { expect } from "@std/expect";
import * as path from "@std/path";
import { getTemplateDir, getVariantsDir } from "../src/utils.ts";

Deno.test("vite - has all required files", async () => {
  const templateDir = path.join(getTemplateDir(), "vite");

  const requiredFiles = [
    "__gitignore",
    "README.md",
    "deno.json.tmpl",
    "vite.config.ts",
    "main.ts",
    "client.ts",
    "utils.ts",
    "assets/styles.css",
    "components/Button.tsx",
    "islands/Counter.tsx",
    "routes/index.tsx",
    "routes/_app.tsx.tmpl",
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
    "deno.json.tmpl",
    "vite.config.ts",
    "main.ts",
    "client.ts",
    "utils.ts",
    "assets/styles.css",
    "components/Button.tsx",
    "islands/Counter.tsx",
    "routes/index.tsx",
    "routes/_app.tsx.tmpl",
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
    "deno.json.tmpl",
    "dev.ts.tmpl",
    "main.ts",
    "utils.ts",
    "components/Button.tsx",
    "islands/Counter.tsx",
    "routes/index.tsx",
    "routes/_app.tsx.tmpl",
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
    "deno.json.tmpl",
    "dev.ts.tmpl",
    "main.ts",
    "utils.ts",
    "components/Button.tsx",
    "islands/Counter.tsx",
    "routes/index.tsx",
    "routes/_app.tsx.tmpl",
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

Deno.test("vite deno.json.tmpl - contains template variables", async () => {
  const templateDir = path.join(getTemplateDir(), "vite");
  const denoJsonPath = path.join(templateDir, "deno.json.tmpl");
  const content = await Deno.readTextFile(denoJsonPath);

  expect(content).toContain("{{FRESH_VERSION}}");
  expect(content).toContain("{{PREACT_VERSION}}");
  expect(content).toContain("{{PREACT_SIGNALS_VERSION}}");
  expect(content).toContain("{{VITE_VERSION}}");
});

Deno.test("vite-tailwind deno.json.tmpl - contains Tailwind dependencies", async () => {
  const templateDir = path.join(getTemplateDir(), "vite-tailwind");
  const denoJsonPath = path.join(templateDir, "deno.json.tmpl");
  const content = await Deno.readTextFile(denoJsonPath);

  expect(content).toContain("{{TAILWINDCSS_VERSION}}");
  expect(content).toContain("{{TAILWINDCSS_VITE_VERSION}}");
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

Deno.test("builder-tailwind deno.json.tmpl - contains Tailwind dependencies", async () => {
  const templateDir = path.join(getTemplateDir(), "builder-tailwind");
  const denoJsonPath = path.join(templateDir, "deno.json.tmpl");
  const content = await Deno.readTextFile(denoJsonPath);

  expect(content).toContain("{{TAILWINDCSS_VERSION}}");
  expect(content).toContain("{{FRESH_TAILWIND_VERSION}}");
});

Deno.test("builder-tailwind static/styles.css - uses Tailwind", async () => {
  const templateDir = path.join(getTemplateDir(), "builder-tailwind");
  const cssPath = path.join(templateDir, "static/styles.css");
  const content = await Deno.readTextFile(cssPath);

  expect(content).toContain('@import "tailwindcss"');
});

Deno.test("vite _app.tsx.tmpl - contains PROJECT_NAME variable", async () => {
  const templateDir = path.join(getTemplateDir(), "vite");
  const appPath = path.join(templateDir, "routes/_app.tsx.tmpl");
  const content = await Deno.readTextFile(appPath);

  expect(content).toContain("{{PROJECT_NAME}}");
});

Deno.test("variants/docker - has Dockerfile", async () => {
  const variantDir = path.join(getVariantsDir(), "docker");
  const dockerfilePath = path.join(variantDir, "Dockerfile");

  const stat = await Deno.stat(dockerfilePath);
  expect(stat).toBeTruthy();
  expect(stat.isFile).toBe(true);

  const content = await Deno.readTextFile(dockerfilePath);
  expect(content).toContain("{{DENO_VERSION}}");
});

Deno.test("variants/vscode - has required files", async () => {
  const variantDir = path.join(getVariantsDir(), "vscode");

  const requiredFiles = [
    "__vscode/settings.json.tmpl",
    "__vscode/extensions.json.tmpl",
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(variantDir, file);
    const stat = await Deno.stat(filePath);
    expect(stat).toBeTruthy();
    expect(stat.isFile).toBe(true);
  }
});
