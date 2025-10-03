import { assertEquals, assertExists } from "@std/assert";
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
    assertExists(stat, `Template file should exist: ${file}`);
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
    assertExists(stat, `Template file should exist: ${file}`);
  }
});

Deno.test("template-vite deno.json.tmpl - contains template variables", async () => {
  const templateDir = path.join(getTemplateDir(), "template-vite");
  const denoJsonPath = path.join(templateDir, "deno.json.tmpl");
  const content = await Deno.readTextFile(denoJsonPath);

  assertEquals(content.includes("{{FRESH_VERSION}}"), true);
  assertEquals(content.includes("{{PREACT_VERSION}}"), true);
  assertEquals(content.includes("{{PREACT_SIGNALS_VERSION}}"), true);
  assertEquals(content.includes("{{VITE_VERSION}}"), true);
});

Deno.test("template-vite _app.tsx.tmpl - contains PROJECT_NAME variable", async () => {
  const templateDir = path.join(getTemplateDir(), "template-vite");
  const appPath = path.join(templateDir, "routes/_app.tsx.tmpl");
  const content = await Deno.readTextFile(appPath);

  assertEquals(content.includes("{{PROJECT_NAME}}"), true);
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
    assertExists(stat, `Variant file should exist: ${file}`);
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
    assertExists(stat, `Variant file should exist: ${file}`);
  }
});

Deno.test("variants/docker - has Dockerfile", async () => {
  const variantDir = path.join(getTemplateDir(), "variants/docker");
  const dockerfilePath = path.join(variantDir, "Dockerfile");

  const stat = await Deno.stat(dockerfilePath);
  assertExists(stat);

  const content = await Deno.readTextFile(dockerfilePath);
  assertEquals(content.includes("{{DENO_VERSION}}"), true);
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
    assertExists(stat, `Variant file should exist: ${file}`);
  }
});

Deno.test("variants/tailwind-vite/deno.json.patch - valid JSON", async () => {
  const patchPath = path.join(
    getTemplateDir(),
    "variants/tailwind-vite/deno.json.patch",
  );
  const content = await Deno.readTextFile(patchPath);

  // Should have template variables
  assertEquals(content.includes("{{TAILWINDCSS_VERSION}}"), true);

  // After replacing variables, should be valid JSON
  const replaced = content.replace(/\{\{[^}]+\}\}/g, "1.0.0");
  JSON.parse(replaced); // Should not throw
});
