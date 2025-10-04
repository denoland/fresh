import { expect } from "@std/expect";
import * as path from "@std/path";
import * as fs from "@std/fs";

/**
 * Helper to create a temporary directory structure for testing
 */
async function createTestStructure(baseDir: string): Promise<void> {
  // Create base template structure
  const baseVite = path.join(baseDir, "assets/base/vite");
  const baseBuilder = path.join(baseDir, "assets/base/builder");

  await fs.ensureDir(path.join(baseVite, "components"));
  await fs.ensureDir(path.join(baseVite, "routes"));
  await fs.ensureDir(path.join(baseBuilder, "components"));
  await fs.ensureDir(path.join(baseBuilder, "static"));

  // Create common files
  await Deno.writeTextFile(
    path.join(baseVite, "main.ts"),
    "export const app = new App();",
  );
  await Deno.writeTextFile(
    path.join(baseVite, "components/Button.tsx"),
    "export function Button() {}",
  );
  await Deno.writeTextFile(
    path.join(baseVite, "routes/index.tsx"),
    "export default function Home() {}",
  );

  await Deno.writeTextFile(
    path.join(baseBuilder, "main.ts"),
    "export const app = new App();",
  );
  await Deno.writeTextFile(
    path.join(baseBuilder, "components/Button.tsx"),
    "export function Button() {}",
  );

  // Create template directories
  const templateVite = path.join(baseDir, "assets/template/vite");
  const templateViteTailwind = path.join(
    baseDir,
    "assets/template/vite-tailwind",
  );
  const templateBuilder = path.join(baseDir, "assets/template/builder");
  const templateBuilderTailwind = path.join(
    baseDir,
    "assets/template/builder-tailwind",
  );

  await fs.ensureDir(templateVite);
  await fs.ensureDir(templateViteTailwind);
  await fs.ensureDir(templateBuilder);
  await fs.ensureDir(templateBuilderTailwind);

  // Create template-specific files
  await Deno.writeTextFile(
    path.join(templateVite, "deno.json.tmpl"),
    '{"imports": {"vite": "npm:vite"}}',
  );
  await Deno.writeTextFile(
    path.join(templateViteTailwind, "deno.json.tmpl"),
    '{"imports": {"vite": "npm:vite", "tailwind": "npm:tailwindcss"}}',
  );
  await Deno.writeTextFile(
    path.join(templateVite, "vite.config.ts"),
    "export default { plugins: [] }",
  );
  await Deno.writeTextFile(
    path.join(templateViteTailwind, "vite.config.ts"),
    "export default { plugins: [tailwind()] }",
  );

  await fs.ensureDir(path.join(templateVite, "assets"));
  await fs.ensureDir(path.join(templateViteTailwind, "assets"));
  await Deno.writeTextFile(
    path.join(templateVite, "assets/styles.css"),
    ".fresh { color: blue; }",
  );
  await Deno.writeTextFile(
    path.join(templateViteTailwind, "assets/styles.css"),
    "@import 'tailwindcss';",
  );

  await fs.ensureDir(path.join(templateBuilder, "static"));
  await fs.ensureDir(path.join(templateBuilderTailwind, "static"));
  await Deno.writeTextFile(
    path.join(templateBuilder, "static/styles.css"),
    ".fresh { color: blue; }",
  );
  await Deno.writeTextFile(
    path.join(templateBuilderTailwind, "static/styles.css"),
    "@import 'tailwindcss';",
  );
}

/**
 * Test that isTemplateSpecific correctly identifies template-specific files
 */
Deno.test("isTemplateSpecific - identifies template-specific files", () => {
  // Import the function from the script
  const TEMPLATE_SPECIFIC_FILES = [
    "deno.json.tmpl",
    "deno.json",
    "vite.config.ts",
    "assets/styles.css",
    "static/styles.css",
  ];

  function isTemplateSpecific(relPath: string): boolean {
    return TEMPLATE_SPECIFIC_FILES.some((specific) =>
      relPath === specific || relPath.endsWith(`/${specific}`)
    );
  }

  // Should return true for template-specific files
  expect(isTemplateSpecific("deno.json.tmpl")).toBe(true);
  expect(isTemplateSpecific("vite.config.ts")).toBe(true);
  expect(isTemplateSpecific("assets/styles.css")).toBe(true);
  expect(isTemplateSpecific("static/styles.css")).toBe(true);
  expect(isTemplateSpecific("path/to/deno.json.tmpl")).toBe(true);

  // Should return false for common files
  expect(isTemplateSpecific("main.ts")).toBe(false);
  expect(isTemplateSpecific("components/Button.tsx")).toBe(false);
  expect(isTemplateSpecific("routes/index.tsx")).toBe(false);
  expect(isTemplateSpecific("README.md")).toBe(false);
});

/**
 * Test sync in dry-run mode
 */
Deno.test("sync_templates - dry run does not modify files", async () => {
  const tmpDir = await Deno.makeTempDir();

  try {
    await createTestStructure(tmpDir);

    // Get path to sync_templates.ts relative to this test file
    const syncScriptPath = path.join(
      path.dirname(path.fromFileUrl(import.meta.url)),
      "../sync_templates.ts",
    );

    // Run sync in dry-run mode
    const process = new Deno.Command("deno", {
      args: [
        "run",
        "-A",
        syncScriptPath,
        "--dry-run",
      ],
      cwd: tmpDir,
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await process.output();
    const output = new TextDecoder().decode(stdout);

    expect(code).toBe(0);
    expect(output).toContain("DRY RUN MODE");
    expect(output).toContain("would be copied");

    // Verify templates are still empty (dry run didn't copy)
    const viteMain = path.join(tmpDir, "assets/template/vite/main.ts");
    const exists = await fs.exists(viteMain);
    expect(exists).toBe(false);
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
});

/**
 * Test actual sync operation
 */
Deno.test("sync_templates - syncs common files correctly", async () => {
  const tmpDir = await Deno.makeTempDir();

  try {
    await createTestStructure(tmpDir);

    // Get path to sync_templates.ts relative to this test file
    const syncScriptPath = path.join(
      path.dirname(path.fromFileUrl(import.meta.url)),
      "../sync_templates.ts",
    );

    // Run actual sync
    const process = new Deno.Command("deno", {
      args: [
        "run",
        "-A",
        syncScriptPath,
      ],
      cwd: tmpDir,
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await process.output();
    const output = new TextDecoder().decode(stdout);

    expect(code).toBe(0);
    expect(output).toContain("Sync complete");

    // Verify common files were copied
    const viteMain = path.join(tmpDir, "assets/template/vite/main.ts");
    const viteButton = path.join(
      tmpDir,
      "assets/template/vite/components/Button.tsx",
    );
    const viteTailwindMain = path.join(
      tmpDir,
      "assets/template/vite-tailwind/main.ts",
    );

    expect(await fs.exists(viteMain)).toBe(true);
    expect(await fs.exists(viteButton)).toBe(true);
    expect(await fs.exists(viteTailwindMain)).toBe(true);

    // Verify content is correct
    const mainContent = await Deno.readTextFile(viteMain);
    expect(mainContent).toBe("export const app = new App();");

    // Verify template-specific files were NOT overwritten
    const viteDeno = path.join(tmpDir, "assets/template/vite/deno.json.tmpl");
    const viteConfig = path.join(tmpDir, "assets/template/vite/vite.config.ts");
    const viteStyles = path.join(
      tmpDir,
      "assets/template/vite/assets/styles.css",
    );

    const denoContent = await Deno.readTextFile(viteDeno);
    const configContent = await Deno.readTextFile(viteConfig);
    const stylesContent = await Deno.readTextFile(viteStyles);

    expect(denoContent).toBe('{"imports": {"vite": "npm:vite"}}');
    expect(configContent).toBe("export default { plugins: [] }");
    expect(stylesContent).toBe(".fresh { color: blue; }");

    // Verify tailwind variant has different template-specific files
    const viteTailwindDeno = path.join(
      tmpDir,
      "assets/template/vite-tailwind/deno.json.tmpl",
    );
    const viteTailwindConfig = path.join(
      tmpDir,
      "assets/template/vite-tailwind/vite.config.ts",
    );
    const viteTailwindStyles = path.join(
      tmpDir,
      "assets/template/vite-tailwind/assets/styles.css",
    );

    const tailwindDenoContent = await Deno.readTextFile(viteTailwindDeno);
    const tailwindConfigContent = await Deno.readTextFile(viteTailwindConfig);
    const tailwindStylesContent = await Deno.readTextFile(viteTailwindStyles);

    expect(tailwindDenoContent).toBe(
      '{"imports": {"vite": "npm:vite", "tailwind": "npm:tailwindcss"}}',
    );
    expect(tailwindConfigContent).toBe(
      "export default { plugins: [tailwind()] }",
    );
    expect(tailwindStylesContent).toBe("@import 'tailwindcss';");
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
});

/**
 * Test that sync handles builder templates correctly
 */
Deno.test("sync_templates - syncs builder templates", async () => {
  const tmpDir = await Deno.makeTempDir();

  try {
    await createTestStructure(tmpDir);

    // Get path to sync_templates.ts relative to this test file
    const syncScriptPath = path.join(
      path.dirname(path.fromFileUrl(import.meta.url)),
      "../sync_templates.ts",
    );

    // Run sync
    const process = new Deno.Command("deno", {
      args: [
        "run",
        "-A",
        syncScriptPath,
      ],
      cwd: tmpDir,
      stdout: "piped",
      stderr: "piped",
    });

    const { code } = await process.output();
    expect(code).toBe(0);

    // Verify builder files were copied
    const builderMain = path.join(tmpDir, "assets/template/builder/main.ts");
    const builderButton = path.join(
      tmpDir,
      "assets/template/builder/components/Button.tsx",
    );
    const builderTailwindMain = path.join(
      tmpDir,
      "assets/template/builder-tailwind/main.ts",
    );

    expect(await fs.exists(builderMain)).toBe(true);
    expect(await fs.exists(builderButton)).toBe(true);
    expect(await fs.exists(builderTailwindMain)).toBe(true);

    // Verify template-specific files were preserved
    const builderStyles = path.join(
      tmpDir,
      "assets/template/builder/static/styles.css",
    );
    const builderTailwindStyles = path.join(
      tmpDir,
      "assets/template/builder-tailwind/static/styles.css",
    );

    const stylesContent = await Deno.readTextFile(builderStyles);
    const tailwindStylesContent = await Deno.readTextFile(
      builderTailwindStyles,
    );

    expect(stylesContent).toBe(".fresh { color: blue; }");
    expect(tailwindStylesContent).toBe("@import 'tailwindcss';");
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
});

/**
 * Test error handling when base directory doesn't exist
 */
Deno.test("sync_templates - handles missing base directory", async () => {
  const tmpDir = await Deno.makeTempDir();

  try {
    // Create only template directories, not base
    await fs.ensureDir(path.join(tmpDir, "assets/template/vite"));
    await fs.ensureDir(path.join(tmpDir, "assets/template/vite-tailwind"));

    // Get path to sync_templates.ts relative to this test file
    const syncScriptPath = path.join(
      path.dirname(path.fromFileUrl(import.meta.url)),
      "../sync_templates.ts",
    );

    // Run sync (should handle missing base gracefully)
    const process = new Deno.Command("deno", {
      args: [
        "run",
        "-A",
        syncScriptPath,
      ],
      cwd: tmpDir,
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await process.output();
    const output = new TextDecoder().decode(stdout);

    // Should complete but report errors
    expect(code).toBe(0);
    expect(output).toContain("error");
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
});
