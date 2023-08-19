import { MiddlewareHandlerContext } from "$fresh/server.ts";

export type LayoutState = {
  something: string;
};

export const handler = (
  _req: Request,
  ctx: MiddlewareHandlerContext<LayoutState>,
) => {
  ctx.state.something = "it works";
  return ctx.next();
};
