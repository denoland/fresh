import { Middleware } from "./compose.ts";

export const trailingSlashes = (mode: "always" | "never"): Middleware => {
  return function trailingSlashesMiddleware(ctx) {
    const url = ctx.url;
    if (url.pathname !== "/") {
      if (mode === "always" && !url.pathname.endsWith("/")) {
        return ctx.redirect(`${url.pathname}/${url.search}`);
      } else if (
        mode === "never" && url.pathname.endsWith("/")
      ) {
        return ctx.redirect(`${url.pathname.slice(0, -1)}${url.search}`);
      }
    }
    return ctx.next();
  };
};
