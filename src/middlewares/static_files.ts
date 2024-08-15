import * as path from "@std/path";
import { contentType as getContentType } from "@std/media-types/content-type";
import type { MiddlewareFn } from "fresh";
import { ASSET_CACHE_BUST_KEY } from "../runtime/shared_internal.tsx";
import { BUILD_ID } from "../runtime/build_id.ts";
import { getBuildCache } from "../context.ts";

/**
 * Fresh middleware to enable file-system based routing.
 * ```ts
 * // Enable Fresh static file serving
 * app.use(freshStaticFles());
 * ```
 */
export function staticFiles<T>(): MiddlewareFn<T> {
  return async function freshStaticFiles(ctx) {
    const { request, url, config } = ctx;
    const buildCache = getBuildCache(ctx);

    let pathname = url.pathname;
    if (config.basePath) {
      pathname = pathname !== config.basePath
        ? pathname.slice(config.basePath.length)
        : "/";
    }

    // Fast path bail out
    const file = await buildCache.readFile(pathname);
    if (pathname === "/" || file === null) {
      // Optimization: Prevent long responses for favicon.ico requests
      if (pathname === "/favicon.ico") {
        return new Response(null, { status: 404 });
      }
      return ctx.next();
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      file.close();
      return new Response("Method Not Allowed", { status: 405 });
    }

    const cacheKey = url.searchParams.get(ASSET_CACHE_BUST_KEY);
    if (cacheKey !== null && BUILD_ID !== cacheKey) {
      url.searchParams.delete(ASSET_CACHE_BUST_KEY);
      const location = url.pathname + url.search;
      file.close();
      return new Response(null, {
        status: 307,
        headers: {
          location,
        },
      });
    }

    const ext = path.extname(pathname);
    const etag = file.hash;

    const contentType = getContentType(ext);
    const headers = new Headers({
      "Content-Type": contentType ?? "text/plain",
      vary: "If-None-Match",
    });

    if (cacheKey === null || ctx.config.mode === "development") {
      headers.append(
        "Cache-Control",
        "no-cache, no-store, max-age=0, must-revalidate",
      );
    } else {
      const ifNoneMatch = request.headers.get("If-None-Match");
      if (
        ifNoneMatch !== null &&
        (ifNoneMatch === etag || ifNoneMatch === `W/"${etag}"`)
      ) {
        file.close();
        return new Response(null, { status: 304, headers });
      } else if (etag !== null) {
        headers.set("Etag", `W/"${etag}"`);
      }
    }

    if (BUILD_ID === cacheKey) {
      headers.append("Cache-Control", "public, max-age=31536000, immutable");
    }

    headers.set("Content-Length", String(file.size));
    if (request.method === "HEAD") {
      file.close();
      return new Response(null, { status: 200, headers });
    }

    return new Response(file.readable, { headers });
  };
}
