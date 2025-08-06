import type { Plugin } from "vite";
import { generateServerEntry } from "fresh/internal-dev";
import { pathWithRoot, type ResolvedFreshViteConfig } from "../utils.ts";
import * as path from "@std/path";

export function serverEntryPlugin(
  options: ResolvedFreshViteConfig,
): Plugin {
  const modName = "fresh:server_entry";

  let serverEntry = "";
  let serverOutDir = "";
  let root = "";

  let isDev = false;

  return {
    name: "fresh:server_entry",
    applyToEnvironment(env) {
      return env.name === "ssr";
    },
    config(_, env) {
      isDev = env.command === "serve";
    },
    configResolved(config) {
      root = config.root;
      serverEntry = pathWithRoot(options.serverEntry, config.root);
      serverOutDir = pathWithRoot(
        config.environments.ssr.build.outDir,
        config.root,
      );
    },
    resolveId(id) {
      if (id === modName) {
        return `\0${modName}`;
      }
    },
    load(id) {
      if (id !== `\0${modName}`) return;

      console.log("vite gen server entry", { serverOutDir, root });
      let code = generateServerEntry({
        root: path.relative(serverOutDir, root),
        serverEntry: path.toFileUrl(serverEntry).href,
        snapshotSpecifier: "fresh:server-snapshot",
      });

      if (isDev) {
        code += `if (import.meta.hot) import.meta.hot.accept();\n`;
      }

      return code;
    },
    async writeBundle() {
      const outDir = path.dirname(serverOutDir);
      await Deno.writeTextFile(
        path.join(outDir, "server.js"),
        `import server from "./server/server-entry.mjs";
export default {
  fetch: server.fetch
};
`,
      );
    },
  };
}
