/** @jsx h */

import { h, PageConfig } from "../client_deps.ts";
import { HandlerContext } from "../../../server.ts";

export const handler = {
  GET(_req: Request, { params }: HandlerContext) {
    return new Response(params.path);
  },
};

export const config: PageConfig = {
  routeOverride: "/params/:path*",
};
