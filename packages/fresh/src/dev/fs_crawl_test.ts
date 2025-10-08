import { expect } from "@std/expect/expect";
import { createFakeFs } from "@fresh/internal/test-utils";
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
