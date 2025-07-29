import type { Plugin } from "vite";
import { generateServerEntry } from "../../../src/dev/dev_build_cache.ts";
import { pathWithRoot, type ResolvedFreshViteConfig } from "../utils.ts";

export function serverEntryPlugin(
  options: ResolvedFreshViteConfig,
): Plugin {
  const modName = "fresh:server_entry";

  let serverEntry = "";
  let root = "";

  return {
    name: "fresh:server_entry",
    applyToEnvironment(env) {
      return env.name === "ssr";
    },
    configResolved(config) {
      root = config.root;
      serverEntry = pathWithRoot(options.serverEntry, config.root);
    },
    resolveId(id) {
      if (id === modName) {
        return `\0${modName}`;
      }
    },
    load(id) {
      if (id !== `\0${modName}`) return;

      let code = generateServerEntry({
        root,
        serverEntry,
        snapshotSpecifier: "fresh:server_snapshot",
      });

      code += `if (import.meta.hot) import.meta.hot.accept();\n`;

      return code;
    },
  };
}
