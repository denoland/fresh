import { INTERNAL_PREFIX, STATIC_PREFIX } from "../shared/constants.ts";

export const IS_BROWSER = typeof document !== "undefined";

/**
 * Register a static asset withh the fresh server
 * @param path a path to a static asset. e.g. /style.css
 */
export function asset(path: string) {
  let BUILD_ID = "____FRESH_BUILD_ID____";
  if (IS_BROWSER) {
    BUILD_ID =
      JSON.parse(document?.getElementById("__FRSH_BUILD_ID")?.textContent!)
        .BUILD_ID;
  }

  return `${INTERNAL_PREFIX}${STATIC_PREFIX}/${BUILD_ID}${path}`;
}
