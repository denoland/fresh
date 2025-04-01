import { define } from "../../utils/state.ts";

export const handler = define.middleware((ctx) => {
  ctx.state.noIndex = true;
  return ctx.next();
});
