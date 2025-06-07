import type { FreshContext } from "../context.ts";
import type { MiddlewareFn } from "./mod.ts";

export type CORSOptions = {
  origin:
    | string
    | string[]
    | ((requestOrigin: string, ctx: FreshContext) => string | undefined | null);
  allowMethods?: string[];
  allowHeaders?: string[];
  maxAge?: number;
  credentials?: boolean;
  exposeHeaders?: string[];
};

/**
 * CORS Middleware for Fresh.
 * Adapted from Hono's CORS middleware.
 * Would like to express my gratitude to all the developers of Hono.
 *
 * @param {CORSOptions} [options] - The options for the CORS middleware.
 * @param {string | string[] | ((requestOrigin: string, ctx: FreshContext) => string | undefined | null)} [options.origin='*'] - The value of "Access-Control-Allow-Origin" CORS header.
 * @param {string[]} [options.allowMethods=['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH']] - The value of "Access-Control-Allow-Methods" CORS header.
 * @param {string[]} [options.allowHeaders=[]] - The value of "Access-Control-Allow-Headers" CORS header.
 * @param {number} [options.maxAge] - The value of "Access-Control-Max-Age" CORS header.
 * @param {boolean} [options.credentials] - The value of "Access-Control-Allow-Credentials" CORS header.
 * @param {string[]} [options.exposeHeaders=[]] - The value of "Access-Control-Expose-Headers" CORS header.
 * @returns {(req: Request, ctx: FreshContext) => Promise<Response>} The Fresh middleware handler function.
 *
 * @example
 * ```ts
 * // main.ts or routes/_middleware.ts
 * import { cors } from 'fresh';
 *
 * export const handler = [
 *   cors({ origin: '*' }), // Allow all origins
 *   // other middlewares or main route handler
 * ];
 *
 * // Example with options:
 * // export const handler = [
 * //   cors({
 * //     origin: 'http://example.com',
 * //     allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
 * //     allowMethods: ['POST', 'GET', 'OPTIONS'],
 * //     exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
 * //     maxAge: 600,
 * //     credentials: true,
 * //   }),
 * //   // ...
 * // ];
 * ```
 */
export function cors<T>(options?: CORSOptions): MiddlewareFn<T> {
  const defaults: Partial<CORSOptions> = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: [],
  };
  const opts = {
    ...defaults,
    ...options,
  } as CORSOptions;

  const findAllowOrigin = ((optsOrigin: CORSOptions["origin"]) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return (_requestOrigin: string, _ctx: FreshContext) => optsOrigin;
      } else {
        return (requestOrigin: string, _ctx: FreshContext) =>
          optsOrigin === requestOrigin ? requestOrigin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return (requestOrigin: string, ctx: FreshContext) =>
        optsOrigin(requestOrigin, ctx);
    } else {
      return (requestOrigin: string, _ctx: FreshContext) =>
        optsOrigin.includes(requestOrigin) ? requestOrigin : null;
    }
  })(opts.origin);

  return async (ctx: FreshContext): Promise<Response> => {
    const responseHeaders = new Headers();

    const requestOrigin = ctx.req.headers.get("origin") || "";
    const allowOrigin = findAllowOrigin(requestOrigin, ctx);

    if (allowOrigin) {
      responseHeaders.set("Access-Control-Allow-Origin", allowOrigin);
    }

    if (opts.credentials) {
      responseHeaders.set("Access-Control-Allow-Credentials", "true");
    }

    if (opts.exposeHeaders?.length) {
      responseHeaders.set(
        "Access-Control-Expose-Headers",
        opts.exposeHeaders.join(","),
      );
    }

    const varyValues = new Set<string>();
    // Add 'Origin' to Vary if a specific origin is allowed, not '*'
    if (opts.origin !== "*" && allowOrigin && allowOrigin !== "*") {
      varyValues.add("Origin");
    }

    if (ctx.req.method === "OPTIONS") {
      if (opts.maxAge != null) {
        responseHeaders.set("Access-Control-Max-Age", opts.maxAge.toString());
      }

      if (opts.allowMethods?.length) {
        responseHeaders.set(
          "Access-Control-Allow-Methods",
          opts.allowMethods.join(","),
        );
      }

      let effectiveAllowHeaders = opts.allowHeaders;
      if (!effectiveAllowHeaders?.length) {
        const reqHeaders = ctx.req.headers.get(
          "Access-Control-Request-Headers",
        );
        if (reqHeaders) {
          effectiveAllowHeaders = reqHeaders.split(/\s*,\s*/);
        }
      }

      if (effectiveAllowHeaders?.length) {
        responseHeaders.set(
          "Access-Control-Allow-Headers",
          effectiveAllowHeaders.join(","),
        );
        varyValues.add("Access-Control-Request-Headers");
      }

      if (varyValues.size > 0) {
        responseHeaders.set("Vary", Array.from(varyValues).join(", "));
      } else {
        responseHeaders.delete("Vary"); // Ensure Vary is not set if no conditions met
      }

      responseHeaders.delete("Content-Length");
      responseHeaders.delete("Content-Type");

      return new Response(null, {
        status: 204,
        statusText: "No Content",
        headers: responseHeaders,
      });
    }

    // For non-OPTIONS requests
    const actualResponse = await ctx.next();

    // Apply common CORS headers (ACAO, Credentials, ExposeHeaders)
    responseHeaders.forEach((value, key) => {
      // Do not overwrite Vary if it was set by downstream, merge instead
      if (key.toLowerCase() !== "vary") {
        actualResponse.headers.set(key, value);
      }
    });

    // Merge our calculated varyValues with any existing Vary from downstream response
    const existingVary = actualResponse.headers.get("Vary");
    if (existingVary) {
      existingVary.split(/\s*,\s*/).forEach((v) => varyValues.add(v));
    }

    if (varyValues.size > 0) {
      actualResponse.headers.set("Vary", Array.from(varyValues).join(", "));
    }
    // If varyValues is empty and no existingVary, Vary header remains absent or as set by downstream.

    return actualResponse;
  };
}
