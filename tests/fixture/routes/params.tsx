/** @jsx h */

import { h, RouteConfig } from "$fresh/runtime.ts";
import { HandlerContext } from "../../../server.ts";

export const handler = {
  GET(_req: Request, { params }: HandlerContext) {
    return new Response(params.path);
  },
};

export const config: RouteConfig = {
  routeOverride: "/params/:path*",
};
