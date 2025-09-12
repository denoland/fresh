import type { Middleware } from "./mod.ts";

/** Middleware to set custom headers on responses
 * @param headers - Record of headers to set
 * @example
 * app.use(headers({
 *   headers: {
 *       'X-Custom-Header': 'value',
 *   },
 * }));
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers
 */
export function headers<State>(
  headers?: Record<string, string>,
): Middleware<State> {
  return async (ctx) => {
    const res = await ctx.next();
    for (const [key, value] of Object.entries(headers || {})) {
      res.headers.set(key, value);
    }
    return res;
  };
}
