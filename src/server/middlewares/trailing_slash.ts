import { Status } from "../deps.ts";
import { Ctx } from "./types.ts";

/**
 * Redirect requests that end with a trailing slash to their
 * non-trailing slash counterpart.
 * Ex: /about/ -> /about
 */
export function trailingSlashMiddleware() {
  return (ctx: Ctx) => {
    const { url, config } = ctx;
    const trailingSlashEnabled = Boolean(config.router?.trailingSlash);

    if (
      url.pathname.length > 1 && url.pathname.endsWith("/") &&
      !trailingSlashEnabled
    ) {
      // Remove trailing slashes
      const path = url.pathname.replace(/\/+$/, "");
      return new Response(null, {
        status: Status.TemporaryRedirect,
        headers: { location: `${path}${url.search}` },
      });
    } else if (trailingSlashEnabled && !url.pathname.endsWith("/")) {
      // If the last element of the path has a "." it's a file
      const isFile = url.pathname.split("/").at(-1)?.includes(".");

      if (!isFile) {
        url.pathname += "/";
        return Response.redirect(url, Status.PermanentRedirect);
      }
    }

    return ctx.next();
  };
}
