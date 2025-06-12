import type { FreshContext } from "../context.ts";

export type IsAllowedOriginHandler = (
  origin: string,
  context: FreshContext,
) => boolean;
export interface CSRFOptions {
  origin?: string | string[] | IsAllowedOriginHandler;
}

const isSafeMethodRe = /^(GET|HEAD)$/;
const isRequestedByFormElementRe =
  /^\b(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)\b/i;

/**
 * CSRF Protection Middleware for Fresh.
 * Adapted from Hono's CORS middleware.
 * Would like to express my gratitude to all the developers of Hono.
 *
 * @param {CSRFOptions} [options] - The options for the CSRF protection middleware.
 * @param {string|string[]|(origin: string, context: Context) => boolean} [options.origin] - Specify origins.
 * @returns {MiddlewareHandler} The middleware handler function.
 *
 * @example
 * ```ts
 * const app = new App<State>()
 *
 * app.use(csrf())
 *
 * // Specifying origins with using `origin` option
 * // string
 * app.use(csrf({ origin: 'https://myapp.example.com' }))
 *
 * // string[]
 * app.use(
 *   csrf({
 *     origin: ['https://myapp.example.com', 'http://development.myapp.example.com'],
 *   })
 * )
 *
 * // Function
 * // It is strongly recommended that the protocol be verified to ensure a match to `$`.
 * // You should *never* do a forward match.
 * app.use(
 *   '*',
 *   csrf({
 *     origin: (origin) => /https:\/\/(\w+\.)?myapp\.example\.com$/.test(origin),
 *   })
 * )
 * ```
 */
export function csrf(
  options?: CSRFOptions,
): (ctx: FreshContext) => Promise<Response> {
  const handler: IsAllowedOriginHandler = ((optsOrigin) => {
    if (!optsOrigin) {
      return (origin, ctx) => origin === new URL(ctx.req.url).origin;
    } else if (typeof optsOrigin === "string") {
      return (origin) => origin === optsOrigin;
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin);
    }
  })(options?.origin);
  const isAllowedOrigin = (
    origin: string | undefined | null,
    ctx: FreshContext,
  ) => {
    if (origin === undefined || origin === null) {
      return false;
    }
    return handler(origin, ctx);
  };

  return async (ctx: FreshContext): Promise<Response> => {
    if (
      !isSafeMethodRe.test(ctx.req.method) &&
      isRequestedByFormElementRe.test(
        ctx.req.headers.get("content-type") || "text/plain",
      ) &&
      !isAllowedOrigin(ctx.req.headers.get("origin"), ctx)
    ) {
      return new Response(
        "Forbidden: CSRF protection failed. The request is not allowed from this origin.",
        {
          status: 403,
        },
      );
    }

    return await ctx.next();
  };
}
