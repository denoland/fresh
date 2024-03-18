import { Middleware } from "./compose.ts";
import * as path from "@std/path";
import { contentType as getContentType } from "@std/media-types/content_type";

export const freshStaticFiles = (): Middleware => {
  return async function serveFreshStaticFiles(ctx) {
    const { req, url, config } = ctx;

    console.log(ctx.buildCache);
    console.log(ctx.buildCache?.getStaticFileInfo(url.pathname));

    // Fast path bail out
    if (url.pathname === "/") return ctx.next();

    const filePath = path.join(config.staticDir, url.pathname);
    // Check that the file path didn't resolve outside of staticDir
    if (path.relative(config.staticDir, filePath).startsWith(".")) {
      return ctx.next();
    }

    // FIXME: Use file list to prevent error creation
    // FIXME: Fast path for missing favicon.ico
    try {
      const stat = await Deno.stat(filePath);
      if (stat.isFile) {
        if (req.method !== "GET" && req.method !== "HEAD") {
          return new Response("Method Not Allowed", { status: 405 });
        }

        const ext = path.extname(filePath);
        const contentType = getContentType(ext);
        const headers = new Headers({
          "Content-Type": contentType ?? "text/plain",
          vary: "If-None-Match",
        });

        const ifNoneMatch = req.headers.get("If-None-Match");

        // if (ifNoneMatch === etag || ifNoneMatch === "W/" + etag) {
        //   return new Response(null, { status: 304, headers });
        // }

        headers.set("Content-Length", String(stat.size));
        if (req.method === "HEAD") {
          return new Response(null, { status: 200, headers });
        }

        const file = await Deno.open(filePath);
        return new Response(file.readable, { headers });
      }
    } catch (err) {
      console.log(err);
      // FIXME:
    }

    return ctx.next();
  };
};
