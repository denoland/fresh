import twDenoJson from "../plugin-tailwindcss/deno.json" with { type: "json" };
import * as Marked from "marked";
import { ensureDir, walk } from "@std/fs";
import { dirname, join, relative } from "@std/path";
// import { expect } from "@std/expect/expect";
import { withTmpDir } from "../src/test_utils.ts";
import { FRESH_VERSION, PREACT_VERSION } from "../update/src/update.ts";

Deno.test("Docs Code example checks", async () => {
  await using tmp = await withTmpDir();

  for await (const { path, code } of docsMarkdownFiles()) {
    const codePath = join(tmp.dir, path);
    await ensureDir(dirname(codePath));
    await Deno.writeTextFile(codePath, code);
  }

  const denoJson = {
    lock: false,
    imports: {
      fresh: `jsr:@fresh/core@${FRESH_VERSION}`,
      "@fresh/plugin-tailwind-v3":
        `jsr:@fresh/plugin-tailwind@^${twDenoJson.version}`,
      "@fresh/plugin-tailwind":
        `jsr:@fresh/plugin-tailwind@^${twDenoJson.version}`,
      preact: `npm:preact@^${PREACT_VERSION}`,
      "@deno/gfm": "jsr:@deno/gfm@^0.11.0",
      "@std/expect": "jsr:@std/expect@^1.0.16",
    },
    compilerOptions: {
      lib: ["dom", "dom.asynciterable", "deno.ns", "deno.unstable"],
      jsx: "precompile",
      jsxImportSource: "preact",
      jsxPrecompileSkipElements: ["a", "img", "source", "body", "html", "head"],
    },
  };
  await Deno.writeTextFile(
    join(tmp.dir, "deno.json"),
    JSON.stringify(denoJson, undefined, 2),
  );

  // Download and cache all dependencies (reduces `stdout` noise)
  await new Deno.Command(Deno.execPath(), {
    args: ["cache", "**/*"],
    cwd: tmp.dir,
  }).output();

  const { stdout, stderr } = await new Deno.Command(Deno.execPath(), {
    args: ["check", "**/*"],
    cwd: tmp.dir,
  }).output();

  const decoder = new TextDecoder();
  const output = `${decoder.decode(stdout)}\n${decoder.decode(stderr)}`;
  // Log `deno check` output (can be removed if expects below are enabled)
  // deno-lint-ignore no-console
  console.log(output);

  // TODO: Enable after fixing docs check issues
  // expect(code).toBe(0);
  // expect(output).toBe("");
});

async function* docsMarkdownFiles() {
  // Limit to checking Fresh v2 (canary) docs for now
  const docsDir = join(import.meta.dirname!, "..", "docs", "canary");
  const docsIter = walk(docsDir, { exts: [".md"], includeDirs: false });

  for await (const entry of docsIter) {
    for (const { file, code } of await extractTsCode(entry.path)) {
      const path = join(relative(docsDir, entry.path), file);
      yield { path, code };
    }
  }
}

async function extractTsCode(path: string) {
  const code: { file: string; code: string }[] = [];
  const input = await Deno.readTextFile(path);
  let index = 0;

  const tokens = await Marked.lexer(input, { gfm: true, async: true });

  Marked.walkTokens(tokens, (token) => {
    // Get rid of `Marked.Tokens.Generic`
    const t = token as Marked.MarkedToken;
    if (t.type !== "code") return;

    const result = /^([tj]sx?)\s*/.exec(t.lang ?? "");
    if (!result) return;

    // Codeblock must be TS/JS
    index += 1;

    // Probably a filename, but perhaps a title,
    // so get rid of non-file safe characters
    const [match, ext] = result;
    let file = t.lang!.slice(match.length)
      .toLocaleLowerCase()
      .replaceAll(/[^a-z0-9._\-\/\\]/g, "_")
      .replaceAll(/_{2,}/g, "_") || String(index);

    if (!file.endsWith(ext)) file += `.${ext}`;

    code.push({ file, code: t.text });
  });

  return code;
}
