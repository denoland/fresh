import type { MiddlewareFn } from "./mod.ts";
import type { FreshContext } from "../mod.ts";

/**
 * Options for {@linkcode cache}.
 */
export interface ServerCacheOptions<State> {
  /**
   * Whether the cache should be used for the request.
   *
   * @param ctx The context of the request.
   * @returns A boolean indicating whether the cache should be used.
   *
   * @example Basic usage
   * ```ts
   * import { App, serverCache } from "fresh";
   *
   * const app = new App()
   *  .use(serverCache(await caches.open("my-cache"), {
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
 * The Cache API is a best-effort storage system used for caching responses and
 * is purely a performance optimization. Data may be evicted by the browser at
 * any time, so it shouldn't be relied on for guaranteed persistence.
 *
 * The {@linkcode ServerCacheOptions.include} option can be used to determine whether
 * the current request should be cached or not based on the context argument.
 *
 * @param cache The cache to use.
 * @param options Options for the cache middleware.
 * @returns A middleware function that caches `GET` requests.
 *
 * @example Cache the whole site
 *
 * All `GET` requests will be cached, including file system routes.
 * Thus requests to `/` will return the same response as long as
 * a cache entry for the `Request` exists.
 *
 * ```ts
 * import { App, serverCache } from "fresh";
 *
 * const app = new App()
 *  .use(serverCache(await caches.open("my-cache")))
 *  .get("/", () => new Response(crypto.randomUUID()));
 *
 * await app.listen();
 * ```
 *
 * @example Cache specific routes
 *
 * ```ts
 * import { App, serverCache } from "fresh";
 *
 * const cache = await caches.open("my-cache");
 *
 * const app = new App()
 *   .get("/cacheable", serverCache(cache), () => new Response("Cached!"))
 *   .use("/uncacheable", () => new Response("Not cached!"));
 *
 * await app.listen();
 * ```
 *
 * @example Cache everything within a path
 *
 * Here, any `GET` requests under `/route/docs/*` will automatically be cached.
 *
 * ```ts
 * // route/docs/_middleware.ts
 * import { serverCache } from "fresh";
 *
 * export default [
 *   serverCache(await caches.open("my-cache"))
 * ];
 * ```
 */
export function serverCache<State>(
  cache: Cache,
  options?: ServerCacheOptions<State>,
): MiddlewareFn<State> {
  return async (ctx) => {
    if (ctx.req.method !== "GET") return ctx.next();

    // TODO(iuioiua): Add support for cache query options once available in Deno
    const cachedRes = await cache.match(ctx.req);
    if (cachedRes) {
      return cachedRes;
    }

    const res = await ctx.next();
    if (options?.include?.(ctx) ?? true) await cache.put(ctx.req, res.clone());
    return res;
  };
}
