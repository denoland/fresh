import type { FreshContext } from "$fresh/server.ts";
import type { TestState } from "../_app.tsx";

export async function handler(
  _req: Request,
  ctx: FreshContext<TestState>,
) {
  ctx.state.stateInProps = "look, i am set from middleware";
  const resp = await ctx.next();
  return resp;
}
