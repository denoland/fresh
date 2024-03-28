import type { FreshContext } from "../context.ts";

/**
 * A middleware is the basic building block of Fresh. It allows you
 * to respond to an incoming request in any way you want. You can
 * redirect routes, serve files, create APIs and much more. Middlewares
 * can be chained by calling `ctx.next()` inside it.
 *
 * ```ts
 * // Example of a middleware to log incoming requests
 * const loggerMiddleware: Middleware = (ctx) => {
 *   console.log(`${ctx.req.method} ${ctx.req.url}`);
 *   // Call the next middleware
 *   return ctx.next();
 * }
 *
 * // Redirect all users going to `/legacy/*` to `/modern/*`
 * const myRedirectMiddleware: Middleware = (ctx) => {
 *   const { url } = ctx;
 *   if (url.pathname.startsWith("/legacy/")) {
 *     return ctx.redirect("/modern");
 *   }
 *
 *   // Otherwise call the next middleware
 *   return ctx.next();
 * }
 *
 * // Usage
 * app
 *   .use(loggerMiddleware)
 *   .use(myRedirectMiddleware);
 * ```
 */
export type Middleware<State = unknown> = (
  ctx: FreshContext<State>,
) => Response | Promise<Response>;

export function runMiddlewares<T>(
  middlewares: Middleware<T>[][],
  ctx: FreshContext<T>,
): Promise<Response> {
  let fn = ctx.next;
  let i = middlewares.length;
  while (i--) {
    const stack = middlewares[i];
    let j = stack.length;
    while (j--) {
      const local = fn;
      const next = stack[j];
      // deno-lint-ignore require-await
      fn = async () => {
        ctx.next = local;
        return next(ctx);
      };
    }
  }

  return fn();
}
