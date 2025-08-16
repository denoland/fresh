import { createBuilder } from "vite";
import * as path from "@std/path";
import { walk } from "@std/fs/walk";
import { withTmpDir } from "../../fresh/src/test_utils.ts";
import { withChildProcessServer } from "../../fresh/tests/test_utils.tsx";

export const DEMO_DIR = path.join(import.meta.dirname!, "..", "demo");
export const FIXTURE_DIR = path.join(import.meta.dirname!, "fixtures");

export async function updateFile(
  filePath: string,
  fn: (text: string) => string | Promise<string>,
) {
  const original = await Deno.readTextFile(filePath);
  const result = await fn(original);
  await Deno.writeTextFile(filePath, result);

  return {
    async [Symbol.asyncDispose]() {
      await Deno.writeTextFile(filePath, original);
    },
  };
}

async function copyDir(from: string, to: string) {
  const entries = walk(from, {
    includeFiles: true,
    includeDirs: false,
    skip: [/([\\/]+(_fresh|node_modules|vendor)[\\/]+|[\\/]+vite\.config\.ts)/],
  });

  for await (const entry of entries) {
    if (entry.isFile) {
      const relative = path.relative(from, entry.path);
      const target = path.join(to, relative);

      try {
        await Deno.mkdir(path.dirname(target), { recursive: true });
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
      }

      await Deno.copyFile(entry.path, target);
    }
  }
}

export async function withDevServer(
  fixtureDir: string,
  fn: (address: string, dir: string) => void | Promise<void>,
  env: Record<string, string> = {},
) {
  await using tmp = await withTmpDir({
    dir: path.join(import.meta.dirname!, ".."),
    prefix: "tmp_vite_",
  });

  await copyDir(fixtureDir, tmp.dir);

  await Deno.writeTextFile(
    path.join(tmp.dir, "vite.config.ts"),
    `import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";

export default defineConfig({
  plugins: [
    fresh(),
  ],
});
`,
  );

  await withChildProcessServer(
    { cwd: tmp.dir, args: ["run", "-A", "npm:vite", "--port", "0"], env },
    async (address) => await fn(address, tmp.dir),
  );
}

export async function buildVite(fixtureDir: string) {
  const tmp = await withTmpDir({
    dir: path.join(import.meta.dirname!, ".."),
    prefix: "tmp_vite_",
  });

  const builder = await createBuilder({
    root: fixtureDir,
    build: {
      emptyOutDir: true,
    },
    environments: {
      ssr: {
        build: {
          outDir: path.join(tmp.dir, "_fresh", "server"),
        },
      },
      client: {
        build: {
          outDir: path.join(tmp.dir, "_fresh", "client"),
        },
      },
    },
  });
  await builder.buildApp();

  return {
    tmp: tmp.dir,
    async [Symbol.asyncDispose]() {
      return await tmp[Symbol.asyncDispose]();
    },
  };
}

export function usingEnv(name: string, value: string) {
  Deno.env.set(name, value);
  return {
    [Symbol.dispose]: () => {
      Deno.env.delete(name);
    },
  };
}
