import type { Plugin } from "vite";

export function polyfillPlugin(): Plugin {
  return {
    name: "fresh:polyfills",
    resolveId(id, _importer, opts) {
      if (opts.ssr && id === "supports-color") {
        return `\0supports-color`;
      }
    },
    load(id) {
      if (id === "\0supports-color") {
        return `function toLevel(depth) {
  if (depth === 1) return 1;
  if (depth === 8) return 2;
  if (depth === 24) return 3;
}

export default {
  stdout: toLevel(process.stdout.getColorDepth()),
  stderr: toLevel(process.stderr.getColorDepth()),
}`;
      }
    },
  };
}
