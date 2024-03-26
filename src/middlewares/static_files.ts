import { Middleware } from "./mod.ts";
import * as path from "@std/path";
import { contentType as getContentType } from "@std/media-types/content_type";

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
    const { req, url, config, buildCache } = ctx;

    // Fast path bail out
    const info = buildCache !== null
      ? buildCache.getFileInfo(url.pathname)
      : null;
    if (url.pathname === "/" || info === null) {
      // Optimization: Prevent long responses for favicon.ico requests
      if (url.pathname === "/favicon.ico") {
        return new Response(null, { status: 404 });
      }
      return ctx.next();
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const basePath = info.generated
      ? path.join(config.build.outDir, "static")
      : config.staticDir;
    const filePath = path.join(basePath, url.pathname);
    const res = await sendFile(req, filePath, basePath, info.hash);

    return res === null ? ctx.next() : res;
  };
}

export async function sendFile(
  req: Request,
  filePath: string,
  directory: string,
  etag: string | null,
): Promise<Response | null> {
  // Check that the file path didn't resolve outside of staticDir.
  // This should already not be the case because the file must have
  // been part of the snapshot.
  if (path.relative(directory, filePath).startsWith(".")) {
    return null;
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
      if (
        etag !== null &&
        (ifNoneMatch === etag || ifNoneMatch === "W/" + etag)
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

    return null;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return new Response(null, { status: 404 });
    }
    // This can only happen if something with the file system is
    // off or the snapshot got out of sync with the actual files.
    return new Response(null, { status: 500 });
  }
}
