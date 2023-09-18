import { gte, join, relative, walk, WalkEntry } from "./deps.ts";
export { generate, type Manifest } from "./manifest.ts";
import type { Manifest } from "./manifest.ts";
import { error } from "./error.ts";
import { FreshOptions } from "../server/mod.ts";
const MIN_DENO_VERSION = "1.31.0";
const TEST_FILE_PATTERN = /[._]test\.(?:[tj]sx?|[mc][tj]s)$/;

export function ensureMinDenoVersion() {
  // Check that the minimum supported Deno version is being used.
  if (!gte(Deno.version.deno, MIN_DENO_VERSION)) {
    let message =
      `Deno version ${MIN_DENO_VERSION} or higher is required. Please update Deno.\n\n`;

    if (Deno.execPath().includes("homebrew")) {
      message +=
        "You seem to have installed Deno via homebrew. To update, run: `brew upgrade deno`\n";
    } else {
      message += "To update, run: `deno upgrade`\n";
    }

    error(message);
  }
}

async function collectDir(
  dir: string,
  callback: (entry: WalkEntry, dir: string) => void,
  options: FreshOptions,
): Promise<void> {
  // Check if provided path is a directory
  try {
    const stat = await Deno.stat(dir);
    if (!stat.isDirectory) return;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return;
    throw err;
  }

  const routesFolder = walk(dir, {
    includeDirs: false,
    includeFiles: true,
    exts: ["tsx", "jsx", "ts", "js"],
    skip: [options?.router?.ignoreFilePattern || TEST_FILE_PATTERN],
  });

  for await (const entry of routesFolder) {
    callback(entry, dir);
  }
}

const GROUP_REG = /[/\\\\]\((_[^/\\\\]+)\)[/\\\\]/;
export async function collect(
  directory: string,
  options: FreshOptions = {},
): Promise<Manifest> {
  const filePaths = new Set<string>();

  const routes: string[] = [];
  const islands: string[] = [];
  await Promise.all([
    collectDir(join(directory, "./routes"), (entry, dir) => {
      const rel = join("routes", relative(dir, entry.path));
      const normalized = rel.slice(0, rel.lastIndexOf("."));

      // A `(_islands)` path segment is a local island folder.
      // Any route path segment wrapped in `(_...)` is ignored
      // during route collection.
      const match = normalized.match(GROUP_REG);
      if (match && match[1].startsWith("_")) {
        if (match[1] === "_islands") {
          islands.push(rel);
        }
        return;
      }

      if (filePaths.has(normalized)) {
        throw new Error(
          `Route conflict detected. Multiple files have the same name: ${dir}${normalized}`,
        );
      }
      filePaths.add(normalized);
      routes.push(rel);
    }, options),
    collectDir(join(directory, "./islands"), (entry, dir) => {
      const rel = join("islands", relative(dir, entry.path));
      islands.push(rel);
    }, options),
  ]);

  routes.sort();
  islands.sort();

  return { routes, islands };
}
