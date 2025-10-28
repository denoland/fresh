import type { Plugin } from "vite";
import * as path from "@std/path";

export const SHIMS: Record<string, string> = {
  "node-fetch": path.join(
    import.meta.dirname!,
    "shims",
    "node-fetch",
    "index.ts",
  ),
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
    sharedDuringBuild: true,
    resolveId: {
      filter: {
        id: /(object\.entries|supports-color|node-fetch)/,
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
