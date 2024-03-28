import type { Middleware } from "./mod.ts";
import * as path from "@std/path";
import { contentType as getContentType } from "@std/media-types/content-type";

// FIXME: Test etag
/**
 * Fresh middleware to enable file-system based routing.
 * ```ts
 * // Enable Fresh static file serving
 * app.use(freshStaticFles());
 * ```
 */
export function freshStaticFiles(): Middleware {
  return async function serveFreshStaticFiles(ctx) {
    const { req, url, buildCache } = ctx;

    // Fast path bail out
    const file = await buildCache.readFile(url.pathname);
    if (url.pathname === "/" || file === null) {
      // Optimization: Prevent long responses for favicon.ico requests
      if (url.pathname === "/favicon.ico") {
        return new Response(null, { status: 404 });
      }
      return ctx.next();
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const ext = path.extname(url.pathname);
    const etag = file.hash;

    const contentType = getContentType(ext);
    const headers = new Headers({
      "Content-Type": contentType ?? "text/plain",
      vary: "If-None-Match",
    });

    if (ctx.config.mode === "development") {
      headers.append(
        "Cache-Control",
        "no-cache, no-store, max-age=0, must-revalidate",
      );
    } else {
      const ifNoneMatch = req.headers.get("If-None-Match");
      if (
        etag !== null &&
        (ifNoneMatch === etag || ifNoneMatch === "W/" + etag)
      ) {
        return new Response(null, { status: 304, headers });
      }
    }

    headers.set("Content-Length", String(file.size));
    if (req.method === "HEAD") {
      return new Response(null, { status: 200, headers });
    }

    return new Response(file.readable, { headers });
  };
}
