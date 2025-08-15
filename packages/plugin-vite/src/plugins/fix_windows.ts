import type { Plugin } from "vite";

// Vite by default uses `C:/` style paths on windows. When you return
// `C:\\` paths you may end up with duplicated modules across chunks...
export function fixWindowsPaths(): Plugin {
  return {
    name: "fresh:fix-windows",
    enforce: "pre",
    async resolveId(id, importer, options) {
      if (Deno.build.os !== "windows") return;

      const resolved = await this.resolve(id, importer, options);

      if (resolved && /^[\w]+:\\/.test(resolved.id)) {
        resolved.id = resolved.id.replaceAll(/[\\/]+/g, "/");
        return resolved;
      }
    },
  };
}
