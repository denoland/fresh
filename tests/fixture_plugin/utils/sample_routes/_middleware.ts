import { FreshContext } from "$fresh/server.ts";
import { PluginMiddlewareState } from "../../utils/route-plugin.ts";

export async function handler(
  _req: Request,
  ctx: FreshContext<PluginMiddlewareState>,
) {
  ctx.state.test = "look, i'm set from a plugin!";
  const resp = await ctx.next();
  return resp;
}
