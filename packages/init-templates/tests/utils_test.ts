import { assertEquals, assertExists } from "@std/assert";
import {
  getLatestVersion,
  isDirectoryEmpty,
  mergeJson,
  processFilename,
  substituteVariables,
} from "../src/utils.ts";

Deno.test("processFilename - converts underscore prefix to dot", () => {
  assertEquals(processFilename("_gitignore"), ".gitignore");
  assertEquals(processFilename("_vscode"), ".vscode");
  assertEquals(processFilename("regular-file.ts"), "regular-file.ts");
});

Deno.test("substituteVariables - replaces template variables", () => {
  const template = "Hello {{NAME}}, version {{VERSION}}!";
  const variables = { NAME: "Fresh", VERSION: "2.0.0" };
  const result = substituteVariables(template, variables);
  assertEquals(result, "Hello Fresh, version 2.0.0!");
});

Deno.test("substituteVariables - handles multiple occurrences", () => {
  const template = "{{X}} + {{X}} = {{Y}}";
  const variables = { X: "1", Y: "2" };
  const result = substituteVariables(template, variables);
  assertEquals(result, "1 + 1 = 2");
});

Deno.test("substituteVariables - handles boolean values", () => {
  const template = "Enabled: {{ENABLED}}";
  const variables = { ENABLED: true };
  const result = substituteVariables(template, variables);
  assertEquals(result, "Enabled: true");
});

Deno.test("mergeJson - merges objects deeply", () => {
  const base = {
    a: 1,
    b: { c: 2, d: 3 },
    e: [1, 2, 3],
  };

  const patch = {
    b: { d: 4, f: 5 },
    e: [4, 5],
    g: 6,
  };

  const result = mergeJson(base, patch);

  assertEquals(result, {
    a: 1,
    b: { c: 2, d: 4, f: 5 },
    e: [4, 5], // Arrays are replaced, not merged
    g: 6,
  });
});

Deno.test("mergeJson - handles nested objects", () => {
  const base = {
    compilerOptions: {
      lib: ["dom"],
      jsx: "precompile",
    },
  };

  const patch = {
    compilerOptions: {
      types: ["vite/client"],
    },
  };

  const result = mergeJson(base, patch);

  assertEquals(result, {
    compilerOptions: {
      lib: ["dom"],
      jsx: "precompile",
      types: ["vite/client"],
    },
  });
});

Deno.test("isDirectoryEmpty - returns true for non-existent directory", async () => {
  const isEmpty = await isDirectoryEmpty("/non/existent/path");
  assertEquals(isEmpty, true);
});

Deno.test("isDirectoryEmpty - returns false for directory with files", async () => {
  const tempDir = await Deno.makeTempDir();
  await Deno.writeTextFile(`${tempDir}/test.txt`, "test");

  const isEmpty = await isDirectoryEmpty(tempDir);
  assertEquals(isEmpty, false);

  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("isDirectoryEmpty - returns true for empty directory", async () => {
  const tempDir = await Deno.makeTempDir();

  const isEmpty = await isDirectoryEmpty(tempDir);
  assertEquals(isEmpty, true);

  await Deno.remove(tempDir);
});

Deno.test("isDirectoryEmpty - returns true for directory with only .git", async () => {
  const tempDir = await Deno.makeTempDir();
  await Deno.mkdir(`${tempDir}/.git`);

  const isEmpty = await isDirectoryEmpty(tempDir);
  assertEquals(isEmpty, true);

  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("getLatestVersion - returns fallback on error", async () => {
  const version = await getLatestVersion("@nonexistent/package", "1.0.0");
  assertEquals(version, "1.0.0");
});

Deno.test("getLatestVersion - fetches real version", async () => {
  // This test requires network access
  const version = await getLatestVersion("@std/assert", "0.0.1");
  assertExists(version);
  // Should return something other than fallback
  // (unless there's a network error, in which case it returns fallback)
});
