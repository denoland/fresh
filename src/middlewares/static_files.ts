import { Middleware } from "./compose.ts";
import * as path from "@std/path";
import { contentType as getContentType } from "@std/media-types/content_type";

export const freshStaticFiles = (): Middleware => {
  return async function serveFreshStaticFiles(ctx) {
    const { req, url, config, buildCache } = ctx;
    // Fast path bail out
    if (
      url.pathname === "/" || buildCache === null ||
      !buildCache.hasStaticFile(url.pathname)
    ) {
      // Optimization: Prevent long responses for favicon.ico requests
      if (url.pathname === "/favicon.ico") {
        return new Response(null, { status: 404 });
      }
      return ctx.next();
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const filePath = path.join(config.staticDir, url.pathname);
    // Check that the file path didn't resolve outside of staticDir.
    // This should already not be the case because the file must have
    // been part of the snapshot.
    if (path.relative(config.staticDir, filePath).startsWith(".")) {
      return ctx.next();
    }

    try {
      const stat = await Deno.stat(filePath);
      if (stat.isFile) {
        const ext = path.extname(filePath);
        const contentType = getContentType(ext);
        const headers = new Headers({
          "Content-Type": contentType ?? "text/plain",
          vary: "If-None-Match",
        });

        const ifNoneMatch = req.headers.get("If-None-Match");
        const etag = buildCache.getStaticFileHash(url.pathname);
        if (
          etag !== null && (ifNoneMatch === etag || ifNoneMatch === "W/" + etag)
        ) {
          return new Response(null, { status: 304, headers });
        }

        headers.set("Content-Length", String(stat.size));
        if (req.method === "HEAD") {
          return new Response(null, { status: 200, headers });
        }

        const file = await Deno.open(filePath);
        return new Response(file.readable, { headers });
      }
    } catch (err) {
      // This can only happen if something with the file system is
      // off or the snapshot got out of sync with the actual files.
      console.error(err);
      return new Response(null, { status: 500 });
    }

    return ctx.next();
  };
};
