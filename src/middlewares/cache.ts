import type { MiddlewareFn } from "./mod.ts";
import type { FreshContext } from "../mod.ts";

/**
 * Options for {@linkcode cache}.
 */
export interface CacheOptions<State> {
  /**
   * Whether the cache should be used for the request.
   *
   * @param ctx The context of the request.
   * @returns A boolean indicating whether the cache should be used.
   *
   * @example Basic usage
   * ```ts
   * import { App, cache } from "fresh";
   *
   * const app = new App()
   *  .use(cache(await caches.open("my-cache"), {
   *    include: (ctx) => ctx.url.pathname === "/cacheable",
   *  }))
   *  .get("/cacheable", () => new Response("Cached!"))
   *  .get("/uncacheable", () => new Response("Not cached!"));
   *
   * await app.listen();
   * ```
   */
  include?: (ctx: FreshContext<State>) => boolean;
}

/**
 * Middleware to cache `GET` requests, based on the
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Cache | Cache API}.
 * The underlying caching mechanism does not yet respect the
 * {@linkcode https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary | Vary}
 * header and takes search parameters into account.
 *
 * The {@linkcode CacheOptions.include} option can be used to determine whether
 * the current request should be cached or not based on the context argument.
 *
 * @param cache The cache to use.
 * @param options Options for the cache middleware.
 * @returns A middleware function that caches `GET` requests.
 *
 * @example Cache the whole site
 *
 * Here, `GET` requests to `/` will return the same response.
 *
 * ```ts
 * import { App, cache } from "fresh";
 *
 * const app = new App()
 *  .use(cache(await caches.open("my-cache")))
 *  .get("/", () => new Response(crypto.randomUUID()));
 *
 * await app.listen();
 * ```
 *
 * @example Cache specific routes
 *
 * ```ts
 * import { App, cache } from "fresh";
 *
 * const webCache = await caches.open("my-cache");
 *
 * const app = new App()
 *   .use("/cacheable", cache(webCache), () => new Response("Cached!"))
 *   .use("/uncacheable", () => new Response("Not cached!"));
 *
 * await app.listen();
 * ```
 */
export function cache<State>(
  cache: Cache,
  options?: CacheOptions<State>,
): MiddlewareFn<State> {
  return async (ctx) => {
    if (
      ctx.req.method !== "GET" || (options?.include && !options.include(ctx))
    ) return ctx.next();

    // TODO(iuioiua): Add support for cache query options once available in Deno
    const cachedRes = await cache.match(ctx.req);
    if (cachedRes) {
      return cachedRes;
    }

    const res = await ctx.next();
    await cache.put(ctx.req, res.clone());
    return res;
  };
}
