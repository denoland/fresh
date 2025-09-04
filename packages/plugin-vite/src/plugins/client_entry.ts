import type { Plugin } from "vite";
import { pathWithRoot, type ResolvedFreshViteConfig } from "../utils.ts";

export function clientEntryPlugin(options: ResolvedFreshViteConfig): Plugin {
  const modName = "fresh:client-entry";
  const modNameUser = "fresh:client-entry-user";

  let clientEntry = "";
  let isDev = false;

  return {
    name: "fresh:client-entry",
    config(_, env) {
      isDev = env.command === "serve";
    },
    applyToEnvironment(env) {
      return env.name === "client";
    },
    configResolved(config) {
      clientEntry = pathWithRoot(options.clientEntry, config.root);
    },
    resolveId: {
      filter: {
        id: /(fresh:client-entry|fresh:client-entry-user)/,
      },
      handler(id) {
        if (id === modName) {
          return `\0${modName}`;
        } else if (id === modNameUser) {
          return clientEntry;
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
          const stat = await Deno.stat(clientEntry);
          exists = stat.isFile;
        } catch {
          exists = false;
        }

        return `
${isDev ? 'import "preact/debug"' : ""}
export * from "fresh/runtime-client";
${exists ? `import "fresh:client-entry-user";` : ""}

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log("accepting")
  });
  import.meta.hot.on("fresh:reload", ev => {
    console.log(ev)
    window.location.reload();
  });
}
`;
      },
    },
  };
}
