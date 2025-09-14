import type { Plugin } from "../../plugin.ts";

export function debugPlugin(): Plugin {
  return {
    name: "fresh:debug",
    setup(ctx) {
      ctx.subscribe("resolve", (ev) => {
        // deno-lint-ignore no-console
        console.log(`resolve [${ev.plugin}]: ${ev.id} -> ${ev.result.id}`);
      });

      ctx.subscribe("load", (ev) => {
        // deno-lint-ignore no-console
        console.log(`load [${ev.plugin}]: ${ev.id}`);
      });

      ctx.subscribe("transform", (ev) => {
        // deno-lint-ignore no-console
        console.log(`transform [${ev.plugin}]: ${ev.id}`);
      });

      ctx.server?.use((req, next) => {
        const url = new URL(req.url);
        if (url.pathname === "/__inspect") {
          return new Response("ok");
        }

        return next();
      });
    },
  };
}
