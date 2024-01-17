import { Plugin } from "$fresh/server.ts";

export function middlewarePlugin1(): Plugin {
  return {
    name: "mw-plugin-1",
    middlewares: [
      {
        path: "/",
        middleware: {
          handler: (_req, ctx) => {
            ctx.state.order += "1";
            return ctx.next();
          },
        },
      },
    ],
  };
}

export function middlewarePlugin2(): Plugin {
  return {
    name: "mw-plugin-2",
    middlewares: [
      {
        path: "/",
        middleware: {
          handler: (_req, ctx) => {
            ctx.state.order += "2";
            return ctx.next();
          },
        },
      },
    ],
  };
}
