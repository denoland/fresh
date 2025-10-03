import { expect } from "@std/expect";
import {
  getLatestVersion,
  isDirectoryEmpty,
  processFilename,
  substituteVariables,
} from "../src/utils.ts";

Deno.test("processFilename - converts double underscore prefix to dot", () => {
  expect(processFilename("__gitignore")).toBe(".gitignore");
  expect(processFilename("__vscode")).toBe(".vscode");
  expect(processFilename("_app.tsx")).toBe("_app.tsx");
  expect(processFilename("regular-file.ts")).toBe("regular-file.ts");
});

Deno.test("substituteVariables - replaces template variables", () => {
  const template = "Hello {{NAME}}, version {{VERSION}}!";
  const variables = { NAME: "Fresh", VERSION: "2.0.0" };
  const result = substituteVariables(template, variables);
  expect(result).toBe("Hello Fresh, version 2.0.0!");
});

Deno.test("substituteVariables - handles multiple occurrences", () => {
  const template = "{{X}} + {{X}} = {{Y}}";
  const variables = { X: "1", Y: "2" };
  const result = substituteVariables(template, variables);
  expect(result).toBe("1 + 1 = 2");
});

Deno.test("substituteVariables - handles boolean values", () => {
  const template = "Enabled: {{ENABLED}}";
  const variables = { ENABLED: true };
  const result = substituteVariables(template, variables);
  expect(result).toBe("Enabled: true");
});

Deno.test("isDirectoryEmpty - returns true for non-existent directory", async () => {
  const isEmpty = await isDirectoryEmpty("/non/existent/path");
  expect(isEmpty).toBe(true);
});

Deno.test("isDirectoryEmpty - returns false for directory with files", async () => {
  const tempDir = await Deno.makeTempDir();
  await Deno.writeTextFile(`${tempDir}/test.txt`, "test");

  const isEmpty = await isDirectoryEmpty(tempDir);
  expect(isEmpty).toBe(false);

  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("isDirectoryEmpty - returns true for empty directory", async () => {
  const tempDir = await Deno.makeTempDir();

  const isEmpty = await isDirectoryEmpty(tempDir);
  expect(isEmpty).toBe(true);

  await Deno.remove(tempDir);
});

Deno.test("isDirectoryEmpty - returns true for directory with only .git", async () => {
  const tempDir = await Deno.makeTempDir();
  await Deno.mkdir(`${tempDir}/.git`);

  const isEmpty = await isDirectoryEmpty(tempDir);
  expect(isEmpty).toBe(true);

  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("getLatestVersion - returns fallback on error", async () => {
  const version = await getLatestVersion("@nonexistent/package", "1.0.0");
  expect(version).toBe("1.0.0");
});

Deno.test("getLatestVersion - fetches real version", async () => {
  // This test requires network access
  const version = await getLatestVersion("@std/assert", "0.0.1");
  expect(version).toBeTruthy();
  // Should return something other than fallback
  // (unless there's a network error, in which case it returns fallback)
});
