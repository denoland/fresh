import * as path from "@std/path";
import { expect } from "@std/expect";

Deno.test("JSX precompile - check config", async () => {
  const cwd = path.join(import.meta.dirname!, "fixture_precompile", "invalid");
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      path.join(cwd, "dev.ts"),
    ],
    cwd,
  }).output();

  const stderr = new TextDecoder().decode(output.stderr);
  expect(stderr).toContain("jsxPrecompileSkipElements to contain");
  expect(output.code).toEqual(1);
});

Deno.test("JSX precompile - run vnode hooks", async () => {
  const cwd = path.join(import.meta.dirname!, "fixture_precompile", "valid");
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      path.join(cwd, "main.tsx"),
    ],
    cwd,
  }).output();

  const stdout = new TextDecoder().decode(output.stdout);
  expect(stdout).toContain('<img src="/foo.jpg?__frsh_c=');
  expect(stdout).toContain('<source src="/bar.jpg?__frsh_c=');
  expect(stdout).toContain('<div f-client-nav="true">');
  expect(stdout).toContain('<span f-client-nav="false">');
  expect(output.code).toEqual(0);
});
