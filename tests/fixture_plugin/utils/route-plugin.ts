import { Plugin } from "$fresh/server.ts";
import { handler as testMiddleware } from "./sample_routes/_middleware.ts";
import { AppBuilder } from "./sample_routes/AppBuilder.tsx";
export type { Options };

interface Options {
  title: string;
}

export default function routePlugin(options: Options): Plugin {
  return {
    name: "routePlugin",
    middlewares: [{
      middleware: { handler: testMiddleware },
      path: "/",
    }],
    routes: [{
      path: "/_app",
      component: AppBuilder(options),
    }],
  };
}
