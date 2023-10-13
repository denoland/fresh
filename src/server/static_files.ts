import { ASSET_CACHE_BUST_KEY } from "../runtime/utils.ts";
import { BUILD_ID } from "./build_id.ts";
import { ComposeHandler } from "./compose.ts";
import { extname, join, relative, typeByExtension } from "./deps.ts";

export interface FileHandlerOptions {
  allowedFiles?: string[];
}

const encoder = new TextEncoder();
export function staticFileMiddleware(
  root: string,
  options: FileHandlerOptions = {},
): ComposeHandler {
  const allowed = options.allowedFiles ? new Set(options.allowedFiles) : null;
  const etags = new Map<string, string>();

  return async (req, ctx) => {
    const url = ctx.url;
    const filePath = join(root, ctx.route.remaining);

    // Check if the filepath resolves to outside of the expected directory
    if (relative(root, filePath).startsWith(".")) {
      return ctx.next();
    }

    // Check if we received an optional list of allowed files and only
    // serve those if we received one
    if (allowed !== null && !allowed.has(ctx.route.remaining)) {
      return ctx.next();
    }

    // Alright, we can serve the file
    let stat: Deno.FileInfo;
    try {
      stat = await Deno.stat(filePath);
    } catch {
      // File doesn't exist or some other error, continue with next
      // middleware
      return ctx.next();
    }

    const key = url.searchParams.get(ASSET_CACHE_BUST_KEY);
    if (key !== null && BUILD_ID !== key) {
      url.searchParams.delete(ASSET_CACHE_BUST_KEY);
      const location = url.pathname + url.search;
      return new Response("", {
        status: 307,
        headers: {
          "content-type": "text/plain",
          location,
        },
      });
    }

    const contentType = typeByExtension(extname(filePath)) ??
      "application/octet-stream";
    const headers = new Headers({
      "content-type": contentType,
      vary: "If-None-Match",
    });

    // Lazily create etags because hashing is a CPU intensive task
    // and increases startup time.
    let etag = etags.get(filePath);
    if (!etag) {
      etag = await crypto.subtle.digest(
        "SHA-1",
        encoder.encode(BUILD_ID + filePath),
      ).then((hash) =>
        Array.from(new Uint8Array(hash))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("")
      );

      etags.set(filePath, etag!);

      headers.set("etag", etag!);
      if (key !== null) {
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
      }

      const ifNoneMatch = req.headers.get("if-none-match");
      if (ifNoneMatch === etag || ifNoneMatch === "W/" + etag) {
        return new Response(null, { status: 304, headers });
      }
    }

    headers.set("content-length", String(stat.size));

    if (req.method === "HEAD") {
      return new Response(null, { status: 200, headers });
    }

    const fsFile = await Deno.open(filePath);
    return new Response(fsFile.readable, { headers });
  };
}
