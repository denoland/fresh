import { VNode } from "preact";
import { BUILD_ID } from "./build_id.ts";

export const INTERNAL_PREFIX = "/_frsh";
export const ASSET_CACHE_BUST_KEY = "__frsh_c";

export const IS_BROWSER = typeof document !== "undefined";

/**
 * Create a "locked" asset path. This differs from a plain path in that it is
 * specific to the current version of the application, and as such can be safely
 * served with a very long cache lifetime (1 year).
 */
export function asset(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  try {
    const url = new URL(path, "https://freshassetcache.local");
    if (
      url.protocol !== "https:" || url.host !== "freshassetcache.local" ||
      url.searchParams.has(ASSET_CACHE_BUST_KEY)
    ) {
      return path;
    }
    url.searchParams.set(ASSET_CACHE_BUST_KEY, BUILD_ID);
    return url.pathname + url.search + url.hash;
  } catch (err) {
    console.warn(
      `Failed to create asset() URL, falling back to regular path ('${path}'):`,
      err,
    );
    return path;
  }
}

/** Apply the `asset` function to urls in a `srcset` attribute. */
export function assetSrcSet(srcset: string): string {
  if (srcset.includes("(")) return srcset; // Bail if the srcset contains complicated syntax.
  const parts = srcset.split(",");
  const constructed = [];
  for (const part of parts) {
    const trimmed = part.trimStart();
    const leadingWhitespace = part.length - trimmed.length;
    if (trimmed === "") return srcset; // Bail if the srcset is malformed.
    let urlEnd = trimmed.indexOf(" ");
    if (urlEnd === -1) urlEnd = trimmed.length;
    const leading = part.substring(0, leadingWhitespace);
    const url = trimmed.substring(0, urlEnd);
    const trailing = trimmed.substring(urlEnd);
    constructed.push(leading + asset(url) + trailing);
  }
  return constructed.join(",");
}

export function assetHashingHook(
  vnode: VNode<{
    src?: string;
    srcset?: string;
    ["data-fresh-disable-lock"]?: boolean;
  }>,
) {
  if (vnode.type === "img" || vnode.type === "source") {
    const { props } = vnode;
    if (props["data-fresh-disable-lock"]) return;
    if (typeof props.src === "string") {
      props.src = asset(props.src);
    }
    if (typeof props.srcset === "string") {
      props.srcset = assetSrcSet(props.srcset);
    }
  }
}
