export const INTERNAL_PREFIX = "/_frsh";
export const ASSET_CACHE_BUST_KEY = "__frsh_c";

export const IS_BROWSER = typeof document !== "undefined";

/**
 * Create a "locked" asset path. This differs from a plain path in that it is
 * specific to the current version of the application, and as such can be safely
 * served with a very long cache lifetime (1 year).
 */
export function asset(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  try {
    const url = new URL(path, "https://freshassetcache.local");
    if (
      url.protocol !== "https:" || url.host !== "freshassetcache.local" ||
      url.searchParams.has(ASSET_CACHE_BUST_KEY)
    ) {
      return path;
    }
    url.searchParams.set(ASSET_CACHE_BUST_KEY, __FRSH_BUILD_ID);
    return url.pathname + url.search + url.hash;
  } catch (err) {
    console.warn(
      `Failed to create asset() URL, falling back to regular path ('${path}'):`,
      err,
    );
    return path;
  }
}
