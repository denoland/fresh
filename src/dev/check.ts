import * as JSONC from "@std/jsonc";
import * as path from "node:path";

export interface DenoConfig {
  workspace?: string[];
  compilerOptions?: {
    jsx?: string;
    jsxImportSource?: string;
    jsxPrecompileSkipElements?: string[];
  };
}

export async function checkDenoCompilerOptions(root: string) {
  const denoJson = await findNearestDenoConfigWithCompilerOptions(
    root,
  );

  const jsxImportSource = denoJson.config.compilerOptions?.jsxImportSource;
  if (jsxImportSource === undefined) {
    throw new Error(
      `Option compilerOptions > jsxImportSource not set in: ${denoJson.filePath}`,
    );
  }

  // Check precompile option
  if (denoJson.config.compilerOptions?.jsx === "precompile") {
    const expected = ["a", "img", "source", "body", "html", "head"];
    const skipped = denoJson.config.compilerOptions.jsxPrecompileSkipElements;
    if (!skipped || expected.some((name) => !skipped.includes(name))) {
      throw new Error(
        `Expected option compilerOptions > jsxPrecompileSkipElements to contain ${
          expected.map((name) => `"${name}"`).join(", ")
        }`,
      );
    }
  }

  return { jsxImportSource, denoJson: denoJson.filePath };
}

export async function findNearestDenoConfigWithCompilerOptions(
  directory: string,
): Promise<{ config: DenoConfig; filePath: string }> {
  let dir = directory;
  while (true) {
    for (const name of ["deno.json", "deno.jsonc"]) {
      const filePath = path.join(dir, name);
      try {
        const file = await Deno.readTextFile(filePath);
        let config;
        if (name.endsWith(".jsonc")) {
          config = JSONC.parse(file);
        } else {
          config = JSON.parse(file);
        }
        if (config.compilerOptions) return { config, filePath };
        if (config.workspace) break;
        break;
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  throw new Error(
    `Could not find a deno.json or deno.jsonc file in the current directory or any parent directory that contains a 'compilerOptions' field.`,
  );
}
