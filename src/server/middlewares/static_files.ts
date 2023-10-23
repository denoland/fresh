import { BuildSnapshot } from "../../build/mod.ts";
import { ASSET_CACHE_BUST_KEY } from "../../constants.ts";
import { extname, typeByExtension } from "../deps.ts";
import { Ctx } from "./types.ts";

/**
 * Server files from the `static/` folder.
 */
export function serveStaticFile(snapshot: BuildSnapshot) {
  return async (ctx: Ctx) => {
    const { url, req } = ctx;

    const fileInfo = await snapshot.getFileInfo(url.pathname);
    if (fileInfo !== null) {
      const { etag, size } = fileInfo;
      const contentType = typeByExtension(extname(url.pathname)) ??
        "application/octet-stream";

      const headers = new Headers({
        "content-type": contentType,
        etag,
        vary: "If-None-Match",
      });

      const cacheControl = url.searchParams.has(ASSET_CACHE_BUST_KEY)
        ? "public, max-age=31536000, immutable"
        // Cache-Control must be set to at least "no-cache" for
        // the etag header to work
        : "no-cache";
      headers.set("Cache-Control", cacheControl);

      const ifNoneMatch = req.headers.get("if-none-match");
      if (ifNoneMatch === etag || ifNoneMatch === "W/" + etag) {
        return new Response(null, { status: 304, headers });
      } else if (req.method === "HEAD") {
        headers.set("content-length", String(size));
        return new Response(null, { status: 200, headers });
      } else if (req.method === "GET") {
        const file = await snapshot.read(url.pathname);
        headers.set("content-length", String(size));
        return new Response(file, { headers });
      }
    }

    return ctx.next();
  };
}
