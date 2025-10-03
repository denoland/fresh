import { expect } from "@std/expect";
import * as path from "@std/path";
import { getTemplateDir } from "../src/utils.ts";

Deno.test("template-vite - has all required files", async () => {
  const templateDir = path.join(getTemplateDir(), "template-vite");

  const requiredFiles = [
    "__gitignore",
    "README.md",
    "deno.json.tmpl",
    "vite.config.ts.tmpl",
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

Deno.test("template-builder - has all required files", async () => {
  const templateDir = path.join(getTemplateDir(), "template-builder");

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

Deno.test("template-vite deno.json.tmpl - contains template variables", async () => {
  const templateDir = path.join(getTemplateDir(), "template-vite");
  const denoJsonPath = path.join(templateDir, "deno.json.tmpl");
  const content = await Deno.readTextFile(denoJsonPath);

  expect(content).toContain("{{FRESH_VERSION}}");
  expect(content).toContain("{{PREACT_VERSION}}");
  expect(content).toContain("{{PREACT_SIGNALS_VERSION}}");
  expect(content).toContain("{{VITE_VERSION}}");
});

Deno.test("template-vite _app.tsx.tmpl - contains PROJECT_NAME variable", async () => {
  const templateDir = path.join(getTemplateDir(), "template-vite");
  const appPath = path.join(templateDir, "routes/_app.tsx.tmpl");
  const content = await Deno.readTextFile(appPath);

  expect(content).toContain("{{PROJECT_NAME}}");
});

Deno.test("variants/tailwind-vite - has required files", async () => {
  const variantDir = path.join(
    getTemplateDir(),
    "variants/tailwind-vite",
  );

  const requiredFiles = [
    "deno.json.patch",
    "vite.config.ts.tmpl",
    "assets/styles.css",
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(variantDir, file);
    const stat = await Deno.stat(filePath);
    expect(stat).toBeTruthy();
    expect(stat.isFile).toBe(true);
  }
});

Deno.test("variants/tailwind-builder - has required files", async () => {
  const variantDir = path.join(
    getTemplateDir(),
    "variants/tailwind-builder",
  );

  const requiredFiles = [
    "deno.json.patch",
    "dev.ts.tmpl",
    "static/styles.css",
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(variantDir, file);
    const stat = await Deno.stat(filePath);
    expect(stat).toBeTruthy();
    expect(stat.isFile).toBe(true);
  }
});

Deno.test("variants/docker - has Dockerfile", async () => {
  const variantDir = path.join(getTemplateDir(), "variants/docker");
  const dockerfilePath = path.join(variantDir, "Dockerfile");

  const stat = await Deno.stat(dockerfilePath);
  expect(stat).toBeTruthy();
  expect(stat.isFile).toBe(true);

  const content = await Deno.readTextFile(dockerfilePath);
  expect(content).toContain("{{DENO_VERSION}}");
});

Deno.test("variants/vscode - has required files", async () => {
  const variantDir = path.join(getTemplateDir(), "variants/vscode");

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

Deno.test("variants/tailwind-vite/deno.json.patch - valid JSON", async () => {
  const patchPath = path.join(
    getTemplateDir(),
    "variants/tailwind-vite/deno.json.patch",
  );
  const content = await Deno.readTextFile(patchPath);

  // Should have template variables
  expect(content).toContain("{{TAILWINDCSS_VERSION}}");

  // After replacing variables, should be valid JSON
  const replaced = content.replace(/\{\{[^}]+\}\}/g, "1.0.0");
  JSON.parse(replaced); // Should not throw
});
