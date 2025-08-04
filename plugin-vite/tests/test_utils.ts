import type { AddressInfo } from "node:net";
import { createBuilder, createServer } from "vite";
import * as path from "@std/path";
import { withTmpDir } from "../../src/test_utils.ts";

export const DEMO_DIR = path.join(import.meta.dirname!, "..", "demo");

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

export async function launchDevServer() {
  const server = await createServer({
    root: DEMO_DIR,
    clearScreen: false,
    build: {
      // Vite types don't match rollup
      // deno-lint-ignore no-explicit-any
      watch: false as any,
    },
  });

  const devServer = await server.listen();
  const addr = devServer.httpServer?.address();

  return {
    addr: `http://localhost:${(addr as AddressInfo).port}`,
    vite: devServer,
    async [Symbol.asyncDispose]() {
      await new Promise((r) => setTimeout(r, 100));
      await devServer.close();
      await new Promise((r) => setTimeout(r, 100));
    },
  };
}

export async function buildVite() {
  const tmp = await withTmpDir();

  const builder = await createBuilder({
    root: DEMO_DIR,
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
