import { Plugin } from "$fresh/server.ts";

export default function conflictingRoutes(): Plugin {
  return {
    name: "conflicting_routes",
    middlewares: [
      {
        path: "/conflicts/:slug",
        middleware: {
          handler: () => new Response("hello"),
        },
      },
    ],
    routes: [
      {
        path: "/conflicts/:slug",
        component: () => {
          return <div>I'll conflict with the route!</div>;
        },
      },
    ],
  };
}
