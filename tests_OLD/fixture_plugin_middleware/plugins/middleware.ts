import type { Plugin } from "$fresh/server.ts";

export function middlewarePlugin(): Plugin {
  return {
    name: "mw-plugin",
    middlewares: [
      {
        path: "/",
        middleware: {
          handler: (req, ctx) => {
            console.log("hey", req.url);
            return ctx.next();
          },
        },
      },
    ],
  };
}
