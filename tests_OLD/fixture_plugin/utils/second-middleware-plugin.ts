import type { FreshContext, Plugin } from "$fresh/server.ts";
import type { PluginMiddlewareState } from "./route-plugin.ts";

export default function secondMiddlewarePlugin(): Plugin<
  PluginMiddlewareState
> {
  return {
    name: "secondMiddlewarePlugin",
    middlewares: [{
      middleware: {
        handler: async (
          _req: Request,
          ctx: FreshContext<PluginMiddlewareState>,
        ) => {
          return await ctx.next();
        },
      },
      path: "/", // this is the root route
    }, {
      middleware: {
        handler: async (
          _req: Request,
          ctx: FreshContext<PluginMiddlewareState>,
        ) => {
          ctx.state.num = ctx.state.num === undefined ? 1 : ctx.state.num + 1;
          return await ctx.next();
        },
      },
      path: "lots-of-middleware/",
    }, {
      middleware: {
        handler: async (
          _req: Request,
          ctx: FreshContext<PluginMiddlewareState>,
        ) => {
          return await ctx.next();
        },
      },
      path: "", // this also goes to the root route, as of 1.4
    }],
  };
}
