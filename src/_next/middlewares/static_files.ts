import { Middleware } from "./compose.ts";
import * as path from "jsr:@std/path";
import { contentType as getContentType } from "jsr:@std/media-types/content_type";

export const freshStaticFiles = (): Middleware => {
  return async function serveFreshStaticFiles(ctx) {
    // Fast path bail out
    if (ctx.url.pathname === "/") return ctx.next();

    const filePath = path.join(ctx.config.staticDir, ctx.url.pathname);
    // Check that the file path didn't resolve outside of staticDir
    if (path.relative(ctx.config.staticDir, filePath).startsWith(".")) {
      return ctx.next();
    }

    // FIXME: Use file list to prevent error creation
    // FIXME: Fast path for missing favicon.ico
    try {
      const stat = await Deno.stat(filePath);
      if (stat.isFile) {
        if (ctx.req.method !== "GET" && ctx.req.method !== "HEAD") {
          return new Response("Method Not Allowed", { status: 405 });
        }

        const file = await Deno.open(filePath);

        const headers = new Headers();
        const ext = path.extname(filePath);
        const contentType = getContentType(ext);
        if (contentType !== undefined) {
          headers.append("Content-Type", contentType);
        }

        return new Response(file.readable, { headers });
      }
    } catch (err) {
      console.log(err);
      // FIXME:
    }

    return ctx.next();
  };
};
