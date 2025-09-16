import type { Plugin } from "vite";
import type { ResolvedFreshViteConfig } from "../utils.ts";

export function islandPlugin(state: ResolvedFreshViteConfig): Plugin {
  return {
    name: "fresh:islands",
    sharedDuringBuild: true,
    applyToEnvironment() {
      return true;
    },
    resolveId: {
      filter: {
        id: /^fresh-island::/,
      },
      handler(id) {
        const name = id.slice("fresh-island::".length);
        const spec = state.islandSpecByName.get(name);
        if (name === undefined) {
          this.warn(`Unkown island: ${name}`);
          return;
        }

        return spec;
      },
    },
  };
}
