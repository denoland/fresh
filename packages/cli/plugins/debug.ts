import type { Plugin } from "../plugin.ts";

export function debugPlugin(): Plugin {
  return {
    name: "fresh:debug",
    setup(ctx) {
      ctx.on("resolve", (ev) => {
        // deno-lint-ignore no-console
        console.log(`resolve [${ev.plugin}]: ${ev.id} -> ${ev.result.id}`);
      });

      ctx.on("load", (ev) => {
        // deno-lint-ignore no-console
        console.log(`load [${ev.plugin}]: ${ev.id}`);
      });

      ctx.on("transform", (ev) => {
        // deno-lint-ignore no-console
        console.log(`transform [${ev.plugin}]: ${ev.id}`);
      });
    },
  };
}
