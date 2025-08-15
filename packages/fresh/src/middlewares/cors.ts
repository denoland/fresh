import type { Context } from "../context.ts";
import type { Middleware } from "./mod.ts";

export type CORSOptions<State> = {
  /**
   * The value of [`Access-Control-Allow-Origin`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Origin) CORS header
   */
  origin:
    | string
    | string[]
    | ((origin: string, ctx: Context<State>) => string | undefined | null);
  /**
   * Sets the permitted methods for the [`Access-Control-Allow-Methods`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Methods) CORS header.
   */
  allowMethods?: string[];
  /**
   * Indicate the HTTP headers that can be used during the actual request. Sets the [`Access-Control-Allow-Headers`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Headers) header
   */
  allowHeaders?: string[];
  /**
   * The value of [`Access-Control-Max-Age`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Max-Age) CORS header
   */
  maxAge?: number;
  /**
   * The value of [`Access-Control-Allow-Credentials`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Credentials) CORS header
   */
  credentials?: boolean;
  /**
   * The value of [`Access-Control-Expose-Headers`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Expose-Headers) CORS header
   */
  exposeHeaders?: string[];
};

/**
 * CORS Middleware to set [`Cross-Origin-Resource-Sharing`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) headers.
 *
 * @param [options] - The options for the CORS middleware.
 * @returns The Fresh middleware handler function.
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
export function cors<State>(options?: CORSOptions<State>): Middleware<State> {
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
    const requestOrigin = ctx.request.headers.get("origin") || "";

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

    if (ctx.request.method === "OPTIONS") {
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
        const reqHeaders = ctx.request.headers.get(
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
