import { expect } from "@std/expect";

Deno.test("JSX precompile - check config", async () => {
  const { stderr, success } = await new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "dev.ts"],
    cwd: new URL("./fixture_precompile/invalid", import.meta.url),
  }).output();

  const stderrText = new TextDecoder().decode(stderr);
  expect(stderrText).toContain("jsxPrecompileSkipElements to contain");
  expect(success).toEqual(false);
});

Deno.test("JSX precompile - run vnode hooks", async () => {
  const { stdout, success } = await new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "main.tsx"],
    cwd: new URL("./fixture_precompile/valid", import.meta.url),
  }).output();

  const stdoutText = new TextDecoder().decode(stdout);
  expect(stdoutText).toContain('<img src="/foo.jpg?__frsh_c=');
  expect(stdoutText).toContain('<source src="/bar.jpg?__frsh_c=');
  expect(stdoutText).toContain('<div f-client-nav="true">');
  expect(stdoutText).toContain('<span f-client-nav="false">');
  expect(success).toEqual(true);
});
