import { FreshContext } from "../context.ts";

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
 *   if (
 *     url.pathname === "/legacy" ||
 *       url.pathname.startsWith("/legacy/"
 *   ) {
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

export function compose<T = unknown>(
  middlewares: Middleware<T>[],
): Middleware<T> {
  // No need to wrap this
  if (middlewares.length === 1) {
    return middlewares[0];
  }

  return (ctx) => {
    const originalNext = ctx.next;

    let idx = -1;
    async function dispatch(i: number): Promise<Response> {
      if (i <= idx) {
        throw new Error("ctx.next() called multiple times");
      }
      idx = i;
      if (i === middlewares.length) {
        return originalNext();
      }

      ctx.next = () => dispatch(i + 1);
      return await middlewares[i](ctx);
    }

    return dispatch(0);
  };
}
