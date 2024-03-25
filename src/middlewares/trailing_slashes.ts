import { Middleware } from "./compose.ts";

/**
 * Fresh middleware to force URLs to end with a slash or never end with one.
 *
 * Usage:
 * ```ts
 * // Always add trailing slash
 * app.use(trailingSlashes("always"));
 * // Never add trailing slashes to URLs and remove them if present
 * app.use(trailingSlashes("never"));
 * ```
 */
export function trailingSlashes(mode: "always" | "never"): Middleware {
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
}
