import type { Plugin } from "vite";
import * as path from "@std/path";

const SHIMS: Record<string, string> = {
  "object.entries": path.join(
    import.meta.dirname!,
    "shims",
    "object.entries",
    "index.ts",
  ),
  "supports-color": path.join(
    import.meta.dirname!,
    "shims",
    "supports-color",
    "index.ts",
  ),
};

export function shims(): Plugin {
  return {
    name: "fresh:shims",
    resolveId: {
      filter: {
        id: /(object\.entries|supports-color)/,
      },
      handler(id) {
        const resolved = SHIMS[id];
        if (resolved !== undefined) {
          return resolved;
        }
      },
    },
  };
}
