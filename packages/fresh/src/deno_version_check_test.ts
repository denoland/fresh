import { expect, fn } from "@std/expect";
import { stub } from "@std/testing/mock";
import { denoVersionWarning } from "./dev/deno_version_check.ts";

Deno.test("denoVersionWarning - warns on outdated stable", async () => {
  // deno-lint-ignore no-explicit-any
  using warnSpy = stub(console, "warn", fn(() => {}) as any);
  await denoVersionWarning({
    force: true,
    getCurrentVersion: () => "2.5.0", // pretend current
    getLatestStable: () => Promise.resolve("2.5.1"),
  });
  expect(warnSpy.fake).toHaveBeenCalled();
  const call = warnSpy.calls[0].args[0];
  expect(call).toContain("Outdated Deno version:");
});

Deno.test("denoVersionWarning - no warn when up to date", async () => {
  // deno-lint-ignore no-explicit-any
  using warnSpy = stub(console, "warn", fn(() => {}) as any);
  await denoVersionWarning({
    force: true,
    getCurrentVersion: () => "2.5.1",
    getLatestStable: () => Promise.resolve("2.5.1"),
  });
  expect(warnSpy.fake).not.toHaveBeenCalled();
});

Deno.test("denoVersionWarning - friendly canary message (one-time)", async () => {
  // deno-lint-ignore no-explicit-any
  using warnSpy = stub(console, "warn", fn(() => {}) as any);
  await denoVersionWarning({
    force: true,
    getCurrentVersion: () => "2.5.1+e7f1793",
    // Should not even call getLatestStable, but provide anyway.
    getLatestStable: () => Promise.resolve("2.5.1"),
  });
  expect(warnSpy.fake).toHaveBeenCalled();
  const call = warnSpy.calls[0].args[0];
  expect(call).toContain("Canary Deno version detected");

  // Second invocation should not duplicate the message
  await denoVersionWarning({
    force: true,
    getCurrentVersion: () => "2.5.1+e7f1793",
    getLatestStable: () => Promise.resolve("2.5.1"),
  });
  expect(warnSpy.calls.length).toBe(1);
});

Deno.test("denoVersionWarning - respects disable env var", async () => {
  Deno.env.set("FRESH_NO_DENO_VERSION_WARNING", "true");
  try {
    // deno-lint-ignore no-explicit-any
    using warnSpy = stub(console, "warn", fn(() => {}) as any);
    await denoVersionWarning({
      getCurrentVersion: () => "2.5.0",
      getLatestStable: () => Promise.resolve("2.5.1"),
    });
    expect(warnSpy.fake).not.toHaveBeenCalled();
  } finally {
    Deno.env.delete("FRESH_NO_DENO_VERSION_WARNING");
  }
});

Deno.test("denoVersionWarning - tolerant on fetch failure", async () => {
  // deno-lint-ignore no-explicit-any
  using warnSpy = stub(console, "warn", fn(() => {}) as any);
  await denoVersionWarning({
    force: true,
    getCurrentVersion: () => "2.5.0",
    getLatestStable: () => Promise.resolve(null), // simulate network failure
  });
  expect(warnSpy.fake).not.toHaveBeenCalled();
});
