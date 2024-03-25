import { FreshContext } from "$fresh/server.ts";

interface State {
  root: string;
  layer1: string;
  layer2: string;
}

export async function handler(
  _req: Request,
  ctx: FreshContext<State>,
) {
  ctx.state.layer2 = "layer2_mw";
  const resp = await ctx.next();
  return resp;
}
