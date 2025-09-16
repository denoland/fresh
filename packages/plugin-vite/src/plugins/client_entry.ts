import type { Plugin } from "vite";
import type { ResolvedFreshViteConfig } from "../utils.ts";

export function clientEntryPlugin(state: ResolvedFreshViteConfig): Plugin {
  return {
    name: "fresh:client-entry",
    sharedDuringBuild: true,
    applyToEnvironment(env) {
      return env.name === "client";
    },
    resolveId: {
      filter: {
        id: /(fresh:client-entry|fresh:client-entry-user)/,
      },
      handler(id) {
        if (id === "fresh:client-entry") {
          return `\0fresh:client-entry`;
        } else if (id === "fresh:client-entry-user") {
          return state.clientEntry;
        }
      },
    },
    load: {
      filter: {
        id: /\0fresh:client-entry/,
      },
      async handler() {
        let exists = false;
        try {
          const stat = await Deno.stat(state.clientEntry);
          exists = stat.isFile;
        } catch {
          exists = false;
        }

        return `${state.isDev ? 'import "preact/debug"' : ""}
export * from "fresh/runtime-client";
${exists ? `import "fresh:client-entry-user";` : ""}
import "@fresh/plugin-vite/client";`;
      },
    },
  };
}
