import type { Plugin } from "vite";
import { JS_REG, type ResolvedFreshViteConfig } from "../utils.ts";
import * as path from "@std/path";

export function routePlugin(state: ResolvedFreshViteConfig): Plugin {
  return {
    name: "fresh:route-resolver",
    sharedDuringBuild: true,
    applyToEnvironment(env) {
      return env.name === "ssr";
    },
    resolveId: {
      filter: {
        id: /^fresh-route::/,
      },
      handler(id) {
        let name = id.slice("fresh-route::".length);

        if (JS_REG.test(name)) {
          name = name.slice(0, name.lastIndexOf("."));
        }

        return `\0fresh-route::${name}`;
      },
    },
    load: {
      filter: {
        id: /^\0fresh-route::.*/,
      },
      handler(id) {
        const name = id.slice("\0fresh-route::".length);

        const route = routes.get(name);
        if (route === undefined) return;

        const fileUrl = path.toFileUrl(route.filePath).href;
        const cssId = state.isDev
          ? `/@id/fresh-route-css::${name}.module.css`
          : `fresh-route-css::${name}.module.css`;

        // For some reason doing `export * from "foo"` is broken
        // in vite.
        const code = `import * as mod from "${fileUrl}";
  import routeCss from "${cssId}";
  export const css = routeCss;
  export const config = mod.config;
  export const handler = mod.handler;
  export const handlers = mod.handlers;
  export default mod.default;
  `;

        return { code };
      },
    },
  };
}

// export function routeCss(state: ResolvedFreshViteConfig): Plugin {
//   return {
//     name: "fresh-route-css-build-ssr",
//     sharedDuringBuild: true,
//     applyToEnvironment(env) {
//       return env.name === "ssr";
//     },
//     async writeBundle(_, bundle) {
//       const asset = bundle[".vite/manifest.json"];
//       if (asset.type === "asset") {
//         const manifest = JSON.parse(asset.source as string) as Manifest;

//         for (const info of Object.values(manifest)) {
//           if (info.name?.startsWith("_fresh-route___")) {
//             const filePath = path.join(serverOutDir, info.file);
//             const content = await Deno.readTextFile(filePath);

//             const replaced = content.replace(
//               `["__FRESH_CSS_PLACEHOLDER__"]`,
//               info.css
//                 ? JSON.stringify(info.css.map((css) => `/${css}`))
//                 : "null",
//             );

//             await Deno.writeTextFile(filePath, replaced);
//           }
//         }
//       }
//     },
//   };
// }
