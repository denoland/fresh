import { BuildSnapshot } from "../../build/mod.ts";
import { extname, typeByExtension } from "../deps.ts";
import { Ctx } from "./types.ts";

/**
 * Serve generated files under `build.outDir`. They are assumed
 * to be long-lived for caching as they can only change with
 * a deployment and contain the deploy key in the URL pathname.
 */
export function serveGeneratedFiles(snapshot: BuildSnapshot) {
  return async (ctx: Ctx) => {
    const { url, config } = ctx;

    const contents = await snapshot.read(url.pathname);

    if (contents) {
      const headers: Record<string, string> = {
        "Cache-Control": config.dev
          // Prevent caching of static assets during dev.
          ? "Cache-Control: no-cache, no-store, max-age=0, must-revalidate"
          : "public, max-age=604800, immutable",
      };

      const contentType = typeByExtension(extname(url.pathname));
      if (contentType) headers["Content-Type"] = contentType;

      return new Response(contents, {
        status: 200,
        headers,
      });
    }

    return ctx.next();
  };
}
