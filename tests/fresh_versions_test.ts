import { walk } from "jsr:@std/fs";
import { relative, resolve } from "jsr:@std/path";

interface DenoConfig {
  version?: string;
  imports?: Record<string, string>;
}

interface VersionMismatch {
  file: string;
  line: number;
  expected: string;
  found: string;
  fullMatch: string;
}

async function readDenoConfig(): Promise<DenoConfig> {
  const configPath = resolve("deno.json");
  const content = await Deno.readTextFile(configPath);
  return JSON.parse(content);
}

function getExpectedFreshVersion(config: DenoConfig): string {
  if (config.version) {
    return config.version;
  }

  if (config.imports?.fresh) {
    const match = config.imports.fresh.match(/@fresh\/core@\^?([^/]+)/);
    if (match?.[1]) {
      return match[1];
    }
  }

  throw new Error("Cannot find expected Fresh version in deno.json");
}

async function checkFileForVersionMismatches(
  filePath: string,
  expectedVersion: string,
): Promise<VersionMismatch[]> {
  const mismatches: VersionMismatch[] = [];

  try {
    const content = await Deno.readTextFile(filePath);
    const lines = content.split("\n");

    const patterns = [
      // Fresh import in import map (prioritize more specific pattern)
      /['"]fresh['"]:\s*['"]jsr:@fresh\/core@\^?([^'"]+)['"]/g,
      // Direct JSR import: jsr:@fresh/core@version (only match when not in import map)
      /(?<!['"]fresh['"]:\s*['"])jsr:@fresh\/core@\^?([^"'\s,}]+)/g,
      // deno.land URL: https://deno.land/x/fresh@version/
      /https:\/\/deno\.land\/x\/fresh@([^\/]+)/g,
      // Version in import statements: "fresh@version" or "@fresh/core@version"
      /['"]@fresh\/core@\^?([^'"\/]+)['"]/g,
      /['"]fresh@([^'"\/]+)['"]/g,
    ];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];

      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let match;

        while ((match = pattern.exec(line)) !== null) {
          const foundVersion = match[1];

          if (!foundVersion.match(/^[0-9]/)) continue;

          if (foundVersion !== expectedVersion) {
            mismatches.push({
              file: filePath,
              line: lineIndex + 1,
              expected: expectedVersion,
              found: foundVersion,
              fullMatch: match[0],
            });
          }
        }
      }
    }
  } catch (error) {
    throw new Error(
      `Error reading file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return mismatches;
}

async function getFilesToScan(): Promise<string[]> {
  const files: string[] = [];

  const dirsToScan = [
    "src",
    "tools",
    "init/src",
    "update/src",
    "examples/src",
    "plugin-tailwindcss/src",
    "www",
    "tests",
  ];

  for (const dir of dirsToScan) {
    try {
      const dirPath = resolve(dir);
      for await (
        const entry of walk(dirPath, {
          includeFiles: true,
          includeDirs: false,
          exts: [".ts", ".tsx", ".js", ".jsx", ".json"],
          skip: [/node_modules/, /_fresh/, /\.git/],
        })
      ) {
        files.push(entry.path);
      }
    } catch {
      // Directory doesn't exist or is not accessible, ignore
    }
  }

  // Add root deno.json file
  const rootFiles = ["deno.json"];
  for (const file of rootFiles) {
    try {
      const filePath = resolve(file);
      await Deno.stat(filePath);
      files.push(filePath);
    } catch {
      // File doesn't exist or is not accessible, ignore
    }
  }

  return files;
}

Deno.test("Fresh version consistency", async () => {
  const config = await readDenoConfig();
  const expectedVersion = getExpectedFreshVersion(config);

  const files = await getFilesToScan();
  const allMismatches: VersionMismatch[] = [];

  for (const file of files) {
    const mismatches = await checkFileForVersionMismatches(
      file,
      expectedVersion,
    );
    allMismatches.push(...mismatches);
  }

  // Remove duplicates
  const uniqueMismatches = allMismatches.filter((mismatch, index) => {
    const key = `${mismatch.file}:${mismatch.line}:${mismatch.found}`;
    return allMismatches.findIndex((m) =>
      `${m.file}:${m.line}:${m.found}` === key
    ) === index;
  });

  if (uniqueMismatches.length > 0) {
    const errorMessage =
      `Found ${uniqueMismatches.length} Fresh version mismatches:\n` +
      uniqueMismatches.map((mismatch) => {
        const relativePath = relative(Deno.cwd(), mismatch.file);
        return `  ${relativePath}:${mismatch.line} - expected ${mismatch.expected}, found ${mismatch.found}`;
      }).join("\n");

    throw new Error(errorMessage);
  }
});
