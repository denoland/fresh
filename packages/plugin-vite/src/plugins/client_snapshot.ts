import type { Plugin, ViteDevServer } from "vite";
import { pathWithRoot, type ResolvedFreshViteConfig } from "../utils.ts";
import { crawlFsItem, specToName } from "fresh/internal-dev";
import * as path from "@std/path";

export function clientSnapshot(state: ResolvedFreshViteConfig): Plugin {
  return {
    name: "fresh:client-snapshot",
    sharedDuringBuild: true,
    applyToEnvironment(env) {
      return env.name === "client";
    },
    resolveId: {
      filter: {
        id: /^fresh:client-snapshot/,
      },
      handler() {
        return `\0fresh:client-snapshot`;
      },
    },
    load() {
      let code = "";

      for (const name of state.islandSpecByName.entries()) {
        const id = `fresh-island::${name}`;
        const emitId = this.emitFile({
          type: "chunk",
          id,
          fileName: `${name}.js`,
        });

        code += `export * as ${name} from "${emitId}";\n`;
      }

      code += `export {}`;

      return code;
    },
  };
}

//   const modName = "fresh:client-snapshot";

//   const islands = new Set<string>();
//   let server: ViteDevServer | undefined;
//   let isDev = false;

//   const entryToIsland = new Map<string, string>();

//   return [
//     {
//       name: "fresh:client-snapshot",
//       sharedDuringBuild: true,
//       applyToEnvironment(env) {
//         return env.name === "client";
//       },

//       config(_, env) {
//         isDev = env.command === "serve";

//         const input: Record<string, string> = {};

//         return {
//           environments: {
//             client: {
//               build: {
//                 rollupOptions: {
//                   input,
//                 },
//               },
//             },
//           },
//         };
//       },
//       // configResolved(cfg) {
//       //   for (const [name, spec] of entryToIsland.entries()) {
//       //     const full = pathWithRoot(spec, cfg.root);
//       //     entryToIsland.set(name, full);
//       //   }
//       // },
//       // options(opts) {
//       //   options.islandSpecifiers.forEach((_name, spec) => {
//       //     islands.add(spec);

//       //     if (!isDev) {
//       //       const specName = specToName(spec);
//       //       const name = options.namer.getUniqueName(specName);
//       //       entryToIsland.set(name, spec);

//       //       // deno-lint-ignore no-explicit-any
//       //       (opts.input as any)[`fresh-island::${name}`] =
//       //         `fresh-client-island::${name}`;
//       //     }
//       //   });
//       // },
//       configureServer(devServer) {
//         server = devServer;
//       },
//       resolveId: {
//         filter: {
//           id: /fresh:client-snapshot/,
//         },
//         handler(id) {
//           if (id === modName) {
//             return `\0${modName}`;
//           }
//         },
//       },
//       load: {
//         filter: {
//           id: /\0fresh:client-snapshot/,
//         },
//         async handler() {
//           const result = await crawlFsItem({
//             islandDir: state.islandsDir,
//             routeDir: state.routeDir,
//             ignore: state.ignore,
//           });

//           this.emitFile({ type: "chunk", id });

//           const imports = Array.from(islands.keys()).map((file, i) => {
//             return `export const mod_${i} = await import(${
//               JSON.stringify(file)
//             });`;
//           }).join("\n");

//           if (isDev && server !== undefined) {
//             const mod = server.environments.ssr.moduleGraph.getModuleById(
//               "\0fresh:server-snapshot",
//             );
//             if (mod) {
//               server.environments.ssr.moduleGraph.invalidateModule(mod);
//             }
//           }

//           return `${imports}
// if (import.meta.hot) {
//   import.meta.hot.accept(() => {
//     console.log("accepting client-snapshot")
//   });
// }
// `;
//         },
//       },
//     },
//     {
//       name: "fresh:client-island",
//       sharedDuringBuild: true,
//       resolveId: {
//         filter: {
//           id: /^fresh-client-island::/,
//         },
//         handler(id) {
//           const name = id.slice("fresh-client-island::".length);
//           const full = entryToIsland.get(name);
//           return full;
//         },
//       },
//     },
//   ];
// }
