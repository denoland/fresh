import { df } from "../../utils/state.ts";

export const handler = df.defineMiddleware((ctx) => {
  ctx.state.noIndex = true;
  return ctx.next();
});
