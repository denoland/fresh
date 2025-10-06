import { defineConfig, type Plugin } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import inspect from "vite-plugin-inspect";
import { copy } from "@std/fs";
import * as path from "@std/path";
import { pathWithRoot } from "../packages/plugin-vite/src/utils.ts";

export default defineConfig({
  plugins: [
    fresh(),
    tailwindcss(),
    inspect(),
    copyDocs(),
  ],
});

function copyDocs(): Plugin {
  let serverOutDir = "";

  return {
    name: "fresh:copy-docs",
    configResolved(config) {
      serverOutDir = pathWithRoot(
        config.environments.ssr.build.outDir,
        config.root,
      );
    },
    async writeBundle() {
      const branches = ["canary", "latest", "1.x"];

      for (const branch of branches) {
        const source = path.join(import.meta.dirname!, "..", "docs", branch);
        const target = path.join(serverOutDir, "docs", branch);

        try {
          await Deno.remove(target, { recursive: true });
        } catch (err) {
          if (!(err instanceof Deno.errors.NotFound)) {
            throw err;
          }
        }

        try {
          await Deno.mkdir(path.dirname(target), { recursive: true });
        } catch {
          // Ignore
        }

        await copy(source, target);
      }
    },
  };
}
