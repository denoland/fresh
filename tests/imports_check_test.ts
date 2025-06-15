import { walk } from "jsr:@std/fs";
import config from "../deno.json" with { type: "json" };
import { dim, green, red, yellow } from "@std/fmt/colors";
import { assert } from "@std/assert";
import { relative } from "@std/path";

Deno.test("unused imports check", async () => {
  const imports = config.imports;
  const unusedImports = [];

  const INDIRECT_DEPENDENCIES = [
    "@std/collections", // Used by remote std/_tools/check_docs.ts
    "@deno/doc", // Used by remote std/_tools/check_docs.ts
  ];

  let allContent = "";
  let fileCount = 0;

  for await (
    const entry of walk(".", {
      exts: [".ts", ".tsx"],
      skip: [
        /\.git/,
        /_fresh/,
        /\.vscode/,
        /\/docs\//,
        /\/examples\//,
      ],
    })
  ) {
    const relativePath = relative(".", entry.path);
    // deno-lint-ignore no-console
    console.log(dim(`Reading: ${relativePath}`));
    try {
      allContent += await Deno.readTextFile(entry.path);
      fileCount++;
    } catch (_error) {
      // deno-lint-ignore no-console
      console.log(red(`Failed: ${relativePath}`));
    }
  }

  // deno-lint-ignore no-console
  console.log(dim(`\nScanned ${fileCount} files\n`));

  for (const [key, value] of Object.entries(imports)) {
    const patterns = [
      `"${key}/`,
      `from "${key}"`,
      `import("${key}")`,
    ];

    const isUsed = patterns.some((pattern) => allContent.includes(pattern));

    if (!isUsed) {
      if (INDIRECT_DEPENDENCIES.includes(key)) {
        // deno-lint-ignore no-console
        console.log(yellow(`Indirect (tool dependency):`), `${key}`);
      } else {
        // deno-lint-ignore no-console
        console.log(red(`Unused:`), `${key} -> ${value}`);
        unusedImports.push(key);
      }
    } else {
      // deno-lint-ignore no-console
      console.log(green(`Used:`), `${key}`);
    }
  }

  assert(
    unusedImports.length === 0,
    red(
      `Found ${unusedImports.length} unused imports: ${
        unusedImports.join(", ")
      }`,
    ),
  );

  // deno-lint-ignore no-console
  console.log(green("🎉 All imports are used!"));
});
