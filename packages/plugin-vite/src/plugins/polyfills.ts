import type { Plugin } from "vite";
import * as path from "@std/path";

const POLYFILL_DIR = path.join(import.meta.dirname!, "polyfills");

// These packages can't be bundled and haven't really been updated in
// years. They are super common though so we vendor them and convert
// them to ESM so that they can be bundled.
const POLYFILLS = new Map<string, string>([
  ["supports-color", path.join(POLYFILL_DIR, "supports-color", "index.ts")],
  ["debug", path.join(POLYFILL_DIR, "debug", "index.ts")],
]);

export function polyfillPlugin(): Plugin {
  return {
    name: "fresh:polyfills",
    enforce: "pre",
    applyToEnvironment() {
      return true;
    },
    resolveId(id, _importer, opts) {
      if (opts.ssr) {
        const polyfill = POLYFILLS.get(id);
        if (polyfill !== undefined) {
          return polyfill;
        }
      }
    },
  };
}
