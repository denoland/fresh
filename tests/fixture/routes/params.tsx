import { HandlerContext, RouteConfig } from "$fresh/server.ts";

export const handler = {
  GET(_req: Request, { params }: HandlerContext) {
    return new Response(params.path);
  },
};

export const config: RouteConfig = {
  routeOverride: "/params/:path*",
};
