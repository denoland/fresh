import { MiddlewareHandlerContext } from "../../../server_deps.ts";

interface TState {
  root: string;
  layer1: string;
  layer2: string;
}

export async function handler(
  _req: Request,
  ctx: MiddlewareHandlerContext<TState>,
) {
  ctx.state.layer2 = "layer2_mw";
  const resp = await ctx.next();
  return resp;
}
