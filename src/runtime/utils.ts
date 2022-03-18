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
