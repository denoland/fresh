import type { Context } from "../context.ts";
import { HttpError } from "../error.ts";
import type { Middleware } from "./mod.ts";

/** Options for {@linkcode csrf}. **/
// deno-lint-ignore no-explicit-any
export interface CsrfOptions<State = any> {
  /**
   * origin - Specifies the allowed origin(s) for requests.
   *  - string: A single allowed origin.
   *  - string[]: static allowed origins.
   *  - function: A function to determine if an origin is allowed.
   */
  origin?:
    | string
    | string[]
    | ((origin: string, context: Context<State>) => boolean);
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
): Middleware<State> {
  const isAllowedOrigin = (
    origin: string | null,
    ctx: Context<State>,
  ) => {
    if (origin === null) {
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
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return await ctx.next();
    }

    const secFetchSite = headers.get("Sec-Fetch-Site");
    const origin = headers.get("origin");

    if (secFetchSite !== null) {
      if (
        secFetchSite === "same-origin" || secFetchSite === "none" ||
        isAllowedOrigin(origin, ctx)
      ) {
        return await ctx.next();
      }

      throw new HttpError(403);
    }

    // Neither `Sec-Fetch-Site` or `Origin` is set
    if (origin === null) {
      return await ctx.next();
    }

    if (isAllowedOrigin(origin, ctx)) {
      return await ctx.next();
    }

    throw new HttpError(403);
  };
}
