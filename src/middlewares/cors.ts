import type { FreshContext } from "../context.ts";
import type { MiddlewareFn } from "./mod.ts";

export type CORSOptions<State> = {
  origin:
    | string
    | string[]
    | ((
      requestOrigin: string,
      ctx: FreshContext<State>,
    ) => string | undefined | null);
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
export function cors<State>(options?: CORSOptions<State>): MiddlewareFn<State> {
  const opts: CORSOptions<State> = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options,
  };

  const addHeaderProperties = (
    headers: Headers,
    allowOrigin: string | null | undefined,
    opts: CORSOptions<State>,
  ) => {
    if (allowOrigin) {
      headers.set("Access-Control-Allow-Origin", allowOrigin);
    }

    if (opts.credentials) {
      headers.set("Access-Control-Allow-Credentials", "true");
    }

    if (opts.exposeHeaders?.length) {
      headers.set(
        "Access-Control-Expose-Headers",
        opts.exposeHeaders.join(","),
      );
    }
  };

  const optsOrigin = opts.origin;

  return async (ctx) => {
    const requestOrigin = ctx.req.headers.get("origin") || "";

    let allowOrigin: string | null = null;
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        allowOrigin = optsOrigin;
      } else {
        allowOrigin = optsOrigin === requestOrigin ? requestOrigin : null;
      }
    } else if (typeof optsOrigin === "function") {
      allowOrigin = optsOrigin(requestOrigin, ctx) ?? null;
    } else {
      allowOrigin = optsOrigin.includes(requestOrigin) ? requestOrigin : null;
    }

    const vary = new Set<string>();
    // Add 'Origin' to Vary if a specific origin is allowed, not '*'
    if (opts.origin !== "*" && allowOrigin && allowOrigin !== "*") {
      vary.add("Origin");
    }

    if (ctx.req.method === "OPTIONS") {
      const headers = new Headers();

      addHeaderProperties(
        headers,
        allowOrigin,
        opts,
      );

      if (opts.maxAge != null) {
        headers.set("Access-Control-Max-Age", opts.maxAge.toString());
      }

      if (opts.allowMethods?.length) {
        headers.set(
          "Access-Control-Allow-Methods",
          opts.allowMethods.join(","),
        );
      }

      let allowHeaders = opts.allowHeaders;
      if (!allowHeaders?.length) {
        const reqHeaders = ctx.req.headers.get(
          "Access-Control-Request-Headers",
        );
        if (reqHeaders) {
          allowHeaders = reqHeaders.split(/\s*,\s*/);
        }
      }

      if (allowHeaders?.length) {
        headers.set(
          "Access-Control-Allow-Headers",
          allowHeaders.join(","),
        );
        vary.add("Access-Control-Request-Headers");
      }

      if (vary.size > 0) {
        headers.set("Vary", Array.from(vary).join(", "));
      } else {
        headers.delete("Vary"); // Ensure Vary is not set if no conditions met
      }

      headers.delete("Content-Length");
      headers.delete("Content-Type");

      return new Response(null, {
        status: 204,
        statusText: "No Content",
        headers,
      });
    }

    // For non-OPTIONS requests
    const res = await ctx.next();

    addHeaderProperties(
      res.headers,
      allowOrigin,
      opts,
    );

    // Merge our calculated varyValues with any existing Vary from downstream response
    if (vary.size > 0) {
      const existing = res.headers.get("Vary");
      if (existing) {
        existing.split(/\s*,\s*/).forEach((v) => vary.add(v));
      }

      res.headers.set("Vary", Array.from(vary).join(", "));
    }

    return res;
  };
}
