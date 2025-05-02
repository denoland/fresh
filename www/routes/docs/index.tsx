import { define } from "../../utils/state.ts";

export const hander = define.handlers({
  GET(ctx) {
    return ctx.url.pathname === "/concepts/architechture"
      ? ctx.redirect("/docs/concepts/architecture")
      : ctx.redirect("/docs/introduction");
  },
});
