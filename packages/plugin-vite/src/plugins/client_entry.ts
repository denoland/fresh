import type { Plugin } from "vite";
import { pathWithRoot, type ResolvedFreshViteConfig } from "../utils.ts";

export function clientEntryPlugin(options: ResolvedFreshViteConfig): Plugin {
  const modName = "fresh:client-entry";
  const modNameUser = "fresh:client-entry-user";

  let clientEntry = "";

  return {
    name: "fresh:client-entry",
    applyToEnvironment(env) {
      return env.name === "client";
    },
    configResolved(config) {
      clientEntry = pathWithRoot(options.clientEntry, config.root);
    },
    resolveId(id) {
      if (id === modName) {
        return `\0${modName}`;
      } else if (id === modNameUser) {
        return clientEntry;
      }
    },
    async load(id) {
      if (id !== `\0${modName}`) return;

      let exists = false;
      try {
        const stat = await Deno.stat(clientEntry);
        exists = stat.isFile;
      } catch {
        exists = false;
      }

      return `export * from "fresh/runtime-client";
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
  };
}
