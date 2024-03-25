import { FreshContext } from "$fresh/server.ts";

export async function handler(
  _req: Request,
  ctx: FreshContext,
) {
  try {
    ctx.state.flag = true;
    return await ctx.next();
  } catch (error) {
    console.log("we're very thoroughly dealing with this error here: " + error);
    throw Error("don't show the full error for security purposes");
  }
}
