import type { Plugin } from "vite";
import * as esbuild from "esbuild";

export function optimizeDeps(): Plugin[] {
  const npmDeps = new Map<string, Map<string, string>>();

  return [
    {
      name: "deno:optimize-deps",
      enforce: "pre",

      resolveId: {
        filter: {
          id: /^deno-optimize::/,
        },
        handler(id) {
          return `\0${id}`;
        },
      },
      load: {
        filter: {
          id: /^\0deno-optimize::/,
        },
        async handler(id, options) {
          const pkg = /^\0?deno-optimize::(@[^/]+\/[^@/]+|[^@/]+)()/;

          await esbuild.build({
            entryPoints: {

            },
            platform: options?.ssr ? "node" : "browser",
            plugins: [{
              name: "deno:external",
              setup(ctx) {
                ctx.onResolve({ filter: /.*/ }, (args) => {
                  console.log(args.path);



                  return null;
                });
              },
            }],
          });
        },
      },
    },
  ];
}
