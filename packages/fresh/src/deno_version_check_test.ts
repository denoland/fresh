import { expect, fn } from "@std/expect";
import { stub } from "@std/testing/mock";
import { denoVersionWarning } from "./dev/deno_version_check.ts";
import * as path from "@std/path";
import * as fs from "@std/fs";

function tempDir() {
  return Deno.makeTempDirSync({ prefix: "fresh-deno-version-test-" });
}

Deno.test("denoVersionWarning - warns on outdated stable", async () => {
  const dir = tempDir();
  // deno-lint-ignore no-explicit-any
  using warnSpy = stub(console, "warn", fn(() => {}) as any);
  await denoVersionWarning({
    force: true,
    getCacheDir: () => dir,
    getCurrentVersion: () => "2.5.0", // pretend current
    getLatestStable: () => Promise.resolve("2.5.1"), // pretend latest
  });
  expect(warnSpy.fake).toHaveBeenCalled();
  const call = warnSpy.calls[0].args[0];
  expect(call).toContain("Outdated Deno version");
});

Deno.test("denoVersionWarning - no warn when up to date", async () => {
  const dir = tempDir();
  // deno-lint-ignore no-explicit-any
  using warnSpy = stub(console, "warn", fn(() => {}) as any);
  await denoVersionWarning({
    force: true,
    getCacheDir: () => dir,
    getCurrentVersion: () => "2.5.1",
    getLatestStable: () => Promise.resolve("2.5.1"),
  });
  expect(warnSpy.fake).not.toHaveBeenCalled();
});

Deno.test("denoVersionWarning - friendly canary message", async () => {
  const dir = tempDir();
  // deno-lint-ignore no-explicit-any
  using warnSpy = stub(console, "warn", fn(() => {}) as any);
  await denoVersionWarning({
    force: true,
    getCacheDir: () => dir,
    getCurrentVersion: () => "2.5.1+e7f1793",
    // Should not even call getLatestStable, but provide anyway.
    getLatestStable: () => Promise.resolve("2.5.1"),
  });
  expect(warnSpy.fake).toHaveBeenCalled();
  const call = warnSpy.calls[0].args[0];
  expect(call).toContain("Canary Deno version detected");
});

Deno.test("denoVersionWarning - respects disable env var", async () => {
  const dir = tempDir();
  Deno.env.set("FRESH_NO_DENO_VERSION_WARNING", "true");
  try {
    // deno-lint-ignore no-explicit-any
    using warnSpy = stub(console, "warn", fn(() => {}) as any);
    await denoVersionWarning({
      getCacheDir: () => dir,
      getCurrentVersion: () => "2.5.0",
      getLatestStable: () => Promise.resolve("2.5.1"),
    });
    expect(warnSpy.fake).not.toHaveBeenCalled();
  } finally {
    Deno.env.delete("FRESH_NO_DENO_VERSION_WARNING");
  }
});

Deno.test("denoVersionWarning - writes cache file", async () => {
  const dir = tempDir();
  await denoVersionWarning({
    force: true,
    getCacheDir: () => dir,
    getCurrentVersion: () => "2.5.0",
    getLatestStable: () => Promise.resolve("2.5.1"),
  });
  const file = path.join(dir, "deno_version.json");
  const exists = await fs.exists(file);
  expect(exists).toBe(true);
});
