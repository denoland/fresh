import type { Plugin } from "vite";

export function clientEntryPlugin(): Plugin {
  const modName = "fresh:client-entry";

  return {
    name: "fresh:client-entry",
    applyToEnvironment(env) {
      return env.name === "client";
    },
    resolveId(id) {
      if (id === modName) {
        return `\0${modName}`;
      }
    },
    load(id) {
      if (id !== `\0${modName}`) return;

      return `export * from "fresh/runtime-client";

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
