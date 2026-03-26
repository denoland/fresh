import { expect } from "@std/expect/expect";
import { createFakeFs } from "../test_utils.ts";
import { walkDir } from "./fs_crawl.ts";

Deno.test("walkDir - ", async () => {
  const fs = createFakeFs({
    "foo/bar/baz.txt": "foo",
    "foo/bar.txt": "foo",
  });

  const files: string[] = [];

  await walkDir(fs, "foo", async (entry) => {
    // Purposely delay
    await new Promise((r) => setTimeout(r, 100));
    files.push(entry.path);
  }, []);

  expect(files).toEqual(["foo/bar/baz.txt", "foo/bar.txt"]);
});

Deno.test("walkDir - respects skip patterns", async () => {
  const fs = createFakeFs({
    "routes/index.tsx": "foo",
    "routes/index_test.tsx": "test",
    "routes/about.tsx": "foo",
    "routes/about.test.ts": "test",
    "routes/api/users.ts": "foo",
    "routes/api/users_test.ts": "test",
  });

  const files: string[] = [];
  const TEST_FILE_PATTERN = /[._]test\.(?:[tj]sx?|[mc][tj]s)$/;

  await walkDir(fs, "routes", (entry) => {
    files.push(entry.path);
  }, [TEST_FILE_PATTERN]);

  // Should only include non-test files
  expect(files).toEqual([
    "routes/index.tsx",
    "routes/about.tsx",
    "routes/api/users.ts",
  ]);
});
