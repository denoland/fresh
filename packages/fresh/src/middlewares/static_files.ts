import type { Middleware } from "./mod.ts";
import { ASSET_CACHE_BUST_KEY } from "../constants.ts";
import { BUILD_ID } from "@fresh/build-id";
import { tracer } from "../otel.ts";
import { getBuildCache } from "../context.ts";

/**
 * Fresh middleware to serve static files from the `static/` directory.
 * ```ts
 * // Enable Fresh static file serving
 * app.use(staticFiles());
 * ```
 */
export function staticFiles<T>(): Middleware<T> {
  return async function freshServeStaticFiles(ctx) {
    const { request, url, config } = ctx;

    const buildCache = getBuildCache(ctx);
    if (buildCache === null) return await ctx.next();

    let pathname = decodeURIComponent(url.pathname);
    if (config.basePath) {
      pathname = pathname !== config.basePath
        ? pathname.slice(config.basePath.length)
        : "/";
    }

    // Fast path bail out
    const startTime = performance.now() + performance.timeOrigin;
    const file = await buildCache.readFile(pathname);
    if (pathname === "/" || file === null) {
      // Optimization: Prevent long responses for favicon.ico requests
      if (pathname === "/favicon.ico") {
        return new Response(null, { status: 404 });
      }
      return await ctx.next();
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      file.close();
      return new Response("Method Not Allowed", { status: 405 });
    }

    const span = tracer.startSpan("static file", {
      attributes: { "fresh.span_type": "static_file" },
      startTime,
    });

    try {
      const cacheKey = url.searchParams.get(ASSET_CACHE_BUST_KEY);
      if (cacheKey !== null && BUILD_ID !== cacheKey) {
        url.searchParams.delete(ASSET_CACHE_BUST_KEY);
        const location = url.pathname + url.search;
        file.close();
        span.setAttribute("fresh.cache", "invalid_bust_key");
        span.setAttribute("fresh.cache_key", cacheKey);
        return new Response(null, {
          status: 307,
          headers: {
            location,
          },
        });
      }

      const etag = file.hash;
      const headers = new Headers({
        "Content-Type": file.contentType,
        vary: "If-None-Match",
      });

      const ifNoneMatch = request.headers.get("If-None-Match");
      if (
        ifNoneMatch !== null &&
        (ifNoneMatch === etag || ifNoneMatch === `W/"${etag}"`)
      ) {
        file.close();
        span.setAttribute("fresh.cache", "not_modified");
        return new Response(null, { status: 304, headers });
      } else if (etag !== null) {
        headers.set("Etag", `W/"${etag}"`);
      }

      if (
        ctx.config.mode !== "development" &&
        (BUILD_ID === cacheKey ||
          url.pathname.startsWith(
            `${ctx.config.basePath}/_fresh/js/${BUILD_ID}/`,
          ))
      ) {
        span.setAttribute("fresh.cache", "immutable");
        headers.append("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        span.setAttribute("fresh.cache", "no_cache");
        headers.append(
          "Cache-Control",
          "no-cache, no-store, max-age=0, must-revalidate",
        );
      }

      headers.set("Content-Length", String(file.size));
      if (request.method === "HEAD") {
        file.close();
        return new Response(null, { status: 200, headers });
      }

      return new Response(file.readable, { headers });
    } finally {
      span.end();
    }
  };
}
