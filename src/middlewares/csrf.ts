import type { FreshContext } from "../context.ts";
import { HttpError } from "../error.ts";
import type { MiddlewareFn } from "./mod.ts";

/** Options for {@linkcode csrf}. **/
export interface CsrfOptions {
  /**
   * origin - Specifies the allowed origin(s) for requests.
   *  - string: A single allowed origin.
   *  - string[]: static allowed origins.
   *  - function: A function to determine if an origin is allowed.
   */
  origin?:
    | string
    | string[]
    | ((origin: string, context: FreshContext) => boolean);
}

/**
 * CSRF Protection Middleware for Fresh.
 *
 * @param options Options for the CSRF protection middleware.
 * @returns The middleware handler function.
 *
 * @example Basic usage (with defaults)
 * ```ts
 * const app = new App<State>()
 *
 * app.use(csrf())
 * ```
 *
 * @example Specifying static origins
 * ```ts
 * app.use(csrf({ origin: 'https://myapp.example.com' }))
 *
 * // string[]
 * app.use(
 *   csrf({
 *     origin: ['https://myapp.example.com', 'http://development.myapp.example.com'],
 *   })
 * )
 * ```
 *
 * @example Specifying more complex origins
 * ```ts
 * app.use(
 *   '*',
 *   csrf({
 *     origin: (origin) => ['https://myapp.example.com', 'http://development.myapp.example.com'].includes(origin),
 *   })
 * )
 * ```
 */
export function csrf<State>(
  options?: CsrfOptions,
): MiddlewareFn<State> {
  const isAllowedOrigin = (
    origin: string | null,
    ctx: FreshContext<State>,
  ) => {
    if (!origin) {
      return false;
    }

    const optsOrigin = options?.origin;

    if (!optsOrigin) {
      return origin === ctx.url.origin;
    }
    if (typeof optsOrigin === "string") {
      return origin === optsOrigin;
    }
    if (typeof optsOrigin === "function") {
      return optsOrigin(origin, ctx);
    }
    return Array.isArray(optsOrigin) && optsOrigin.includes(origin);
  };

  return async (ctx) => {
    const { method, headers } = ctx.req;

    // Safe methods
    if (method === "GET" || method === "HEAD") {
      return await ctx.next();
    }

    const contentType = headers.get("content-type")?.toLowerCase() ??
      "text/plain";

    // Check if initiated by form
    if (
      (contentType === "application/x-www-form-urlencoded" ||
        contentType === "multipart/form-data" ||
        contentType === "text/plain") &&
      !isAllowedOrigin(headers.get("origin"), ctx)
    ) {
      throw new HttpError(
        403,
        "CSRF protection failed. The request is not allowed from this origin.",
      );
    }

    return await ctx.next();
  };
}
