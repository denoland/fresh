import * as path from "@std/path";
import { contentType as getContentType } from "@std/media-types/content-type";
import type { FreshContext } from "../context.ts";
import type { BuildCache } from "../build_cache.ts";

/**
 * Fresh middleware to enable file-system based routing.
 * ```ts
 * // Enable Fresh static file serving
 * app.use(freshStaticFles());
 * ```
 */
export async function freshStaticFiles<T>(
  ctx: FreshContext<T>,
  buildCache: BuildCache | null,
) {
  const { req, url } = ctx;

  if (buildCache === null) return ctx.next();

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

  // FIXME
  if (ctx.config.mode === "development" || true) {
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
}
