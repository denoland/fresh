import { ComposeHandler } from "$fresh/src/server/compose.ts";
import { INTERNAL_PREFIX } from "$fresh/src/runtime/utils.ts";
import { Status } from "$fresh/src/server/deps.ts";

export function trailingSlashMiddleware(
  trailingSlashEnabled: boolean,
): ComposeHandler {
  return (req, ctx) => {
    // Redirect requests that end with a trailing slash to their non-trailing
    // slash counterpart.
    // Ex: /about/ -> /about
    const url = new URL(req.url);
    if (
      url.pathname.length > 1 && url.pathname.endsWith("/") &&
      !trailingSlashEnabled
    ) {
      // Remove trailing slashes
      const path = url.pathname.replace(/\/+$/, "");
      const location = `${path}${url.search}`;
      return new Response(null, {
        status: Status.TemporaryRedirect,
        headers: { location },
      });
    } else if (trailingSlashEnabled && !url.pathname.endsWith("/")) {
      // If the last element of the path has a "." it's a file
      const isFile = url.pathname.split("/").at(-1)?.includes(".");

      // If the path uses the internal prefix, don't redirect it
      const isInternal = url.pathname.startsWith(INTERNAL_PREFIX);

      if (!isFile && !isInternal) {
        url.pathname += "/";
        return Response.redirect(url, Status.PermanentRedirect);
      }
    }

    return ctx.next();
  };
}
