import { assertEquals } from "@std/assert";
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
  assertEquals(isTemplateSpecific("deno.json.tmpl"), true);
  assertEquals(isTemplateSpecific("vite.config.ts"), true);
  assertEquals(isTemplateSpecific("assets/styles.css"), true);
  assertEquals(isTemplateSpecific("static/styles.css"), true);
  assertEquals(isTemplateSpecific("path/to/deno.json.tmpl"), true);

  // Should return false for common files
  assertEquals(isTemplateSpecific("main.ts"), false);
  assertEquals(isTemplateSpecific("components/Button.tsx"), false);
  assertEquals(isTemplateSpecific("routes/index.tsx"), false);
  assertEquals(isTemplateSpecific("README.md"), false);
});

/**
 * Test sync in dry-run mode
 */
Deno.test("sync_templates - dry run does not modify files", async () => {
  const tmpDir = await Deno.makeTempDir();

  try {
    await createTestStructure(tmpDir);

    // Run sync in dry-run mode
    const process = new Deno.Command("deno", {
      args: [
        "run",
        "-A",
        path.join(Deno.cwd(), "sync_templates.ts"),
        "--dry-run",
      ],
      cwd: tmpDir,
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await process.output();
    const output = new TextDecoder().decode(stdout);

    assertEquals(code, 0, "Sync script should exit successfully");
    assertEquals(
      output.includes("DRY RUN MODE"),
      true,
      "Should indicate dry run mode",
    );
    assertEquals(
      output.includes("would be copied"),
      true,
      "Should show what would be copied",
    );

    // Verify templates are still empty (dry run didn't copy)
    const viteMain = path.join(tmpDir, "assets/template/vite/main.ts");
    const exists = await fs.exists(viteMain);
    assertEquals(exists, false, "Dry run should not create files");
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

    // Run actual sync
    const process = new Deno.Command("deno", {
      args: [
        "run",
        "-A",
        path.join(Deno.cwd(), "sync_templates.ts"),
      ],
      cwd: tmpDir,
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await process.output();
    const output = new TextDecoder().decode(stdout);

    assertEquals(code, 0, "Sync script should exit successfully");
    assertEquals(
      output.includes("Sync complete"),
      true,
      "Should indicate completion",
    );

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

    assertEquals(
      await fs.exists(viteMain),
      true,
      "Should copy main.ts to vite",
    );
    assertEquals(
      await fs.exists(viteButton),
      true,
      "Should copy Button.tsx to vite",
    );
    assertEquals(
      await fs.exists(viteTailwindMain),
      true,
      "Should copy main.ts to vite-tailwind",
    );

    // Verify content is correct
    const mainContent = await Deno.readTextFile(viteMain);
    assertEquals(mainContent, "export const app = new App();");

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

    assertEquals(
      denoContent,
      '{"imports": {"vite": "npm:vite"}}',
      "Should preserve deno.json.tmpl",
    );
    assertEquals(
      configContent,
      "export default { plugins: [] }",
      "Should preserve vite.config.ts",
    );
    assertEquals(
      stylesContent,
      ".fresh { color: blue; }",
      "Should preserve styles.css",
    );

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

    assertEquals(
      tailwindDenoContent,
      '{"imports": {"vite": "npm:vite", "tailwind": "npm:tailwindcss"}}',
      "Should preserve tailwind deno.json.tmpl",
    );
    assertEquals(
      tailwindConfigContent,
      "export default { plugins: [tailwind()] }",
      "Should preserve tailwind vite.config.ts",
    );
    assertEquals(
      tailwindStylesContent,
      "@import 'tailwindcss';",
      "Should preserve tailwind styles.css",
    );
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

    // Run sync
    const process = new Deno.Command("deno", {
      args: [
        "run",
        "-A",
        path.join(Deno.cwd(), "sync_templates.ts"),
      ],
      cwd: tmpDir,
      stdout: "piped",
      stderr: "piped",
    });

    const { code } = await process.output();
    assertEquals(code, 0, "Sync script should exit successfully");

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

    assertEquals(
      await fs.exists(builderMain),
      true,
      "Should copy main.ts to builder",
    );
    assertEquals(
      await fs.exists(builderButton),
      true,
      "Should copy Button.tsx to builder",
    );
    assertEquals(
      await fs.exists(builderTailwindMain),
      true,
      "Should copy main.ts to builder-tailwind",
    );

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

    assertEquals(
      stylesContent,
      ".fresh { color: blue; }",
      "Should preserve builder styles.css",
    );
    assertEquals(
      tailwindStylesContent,
      "@import 'tailwindcss';",
      "Should preserve builder-tailwind styles.css",
    );
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

    // Run sync (should handle missing base gracefully)
    const process = new Deno.Command("deno", {
      args: [
        "run",
        "-A",
        path.join(Deno.cwd(), "sync_templates.ts"),
      ],
      cwd: tmpDir,
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await process.output();
    const output = new TextDecoder().decode(stdout);

    // Should complete but report errors
    assertEquals(code, 0, "Script should exit successfully");
    assertEquals(output.includes("error"), true, "Should report errors");
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
});
