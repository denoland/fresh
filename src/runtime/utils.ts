import { VNode } from "./deps.ts";

export const INTERNAL_PREFIX = "/_frsh";
export const STATIC_PREFIX = `/static`;

export const IS_BROWSER = typeof document !== "undefined";

/**
 * Return a path "hashed" with the BUILD_ID. of a static file
 * Such path will be served by the server with a Cache-Control of 1 year.
 * @param path a path to a file in the static folder asset. e.g. /style.css
 */
export function asset(path: string) {
  return `${INTERNAL_PREFIX}${STATIC_PREFIX}/${__FRSH_BUILD_ID}${path}`;
}

// apply the asset function a srcset
export function assetSrcSet(srcset: string) {
  const srcsetParts = srcset.split(",");
  return srcsetParts.map((part) => {
    const sections = part.trim().split(" ");
    sections[0] = asset(sections[0]);
    return sections.join(" ");
  }).join(", ");
}

export function assetHashingHook(vnode: VNode) {
  if (vnode.type === "img" || vnode.type === "source") {
    const props = (vnode.props as HTMLImageElement);
    // deno-lint-ignore no-explicit-any
    if ((props as any)["data-no-auto-hashing"]) return;

    // apply for src
    if (
      props.src &&
      // do not apply the for assets that are already targetting a fresh special handling
      !props.src.startsWith(INTERNAL_PREFIX) &&
      // Only apply for assets that is referenced from the static folder, i.e path starting by '/'
      props.src.startsWith("/")
    ) {
      props.src = asset(props.src);
    }

    // apply for srcset
    if (
      props.srcset &&
      // do not apply the for assets that are already targetting a fresh special handling
      !props.srcset.startsWith(INTERNAL_PREFIX) &&
      // Only apply for assets that is referenced from the static folder, i.e path starting by '/'
      props.srcset.startsWith("/")
    ) {
      props.srcset = assetSrcSet(props.srcset);
    }
  }
}
