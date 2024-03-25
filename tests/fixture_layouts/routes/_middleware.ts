import { FreshContext } from "$fresh/server.ts";

export type LayoutState = {
  something: string;
};

export const handler = (
  _req: Request,
  ctx: FreshContext<LayoutState>,
) => {
  ctx.state.something = "it works";
  return ctx.next();
};
