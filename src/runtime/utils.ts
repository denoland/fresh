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

export function assetHashingHook(vnode: VNode) {
  if (vnode.type === "img") {
    const props = (vnode.props as HTMLImageElement);
    if (
      // deno-lint-ignore no-explicit-any
      props.src && !(props as any)["data-no-auto-hashing"] &&
      // do not apply the for assets that are already targetting the a frsh special handling
      !props.src.startsWith(INTERNAL_PREFIX) &&
      // Only apply for assets that is referenced from the static folder, i.e path starting by '/'
      props.src.startsWith("/")
    ) {
      (vnode.props as HTMLImageElement).src = asset(props.src);
    }
  }
}
