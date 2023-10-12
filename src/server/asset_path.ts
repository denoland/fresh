// This a prefix for the asset urls. It is used to set a cdn url as the prefix for static files and internal js files such as islands.

export let ASSET_PATH_PREFIX = "";

/**
 * Sets the prefix for the asset path.
 */
export function setAssetPathPrefix(prefix: string) {
  ASSET_PATH_PREFIX = prefix;
}

/**
 * Checks if the asset path has a prefix.
 */
export function hasAssetPrefix() {
  return ASSET_PATH_PREFIX !== "";
}

/**
 * Helper to use in templates. It returns the full path of an asset by concatenating the ASSET_PATH_PREFIX with the provided path.
 * This is useful to get the right path durning development and production.
 * i.e staticFile("/test.png")
 */
export function staticFile(path: string): string {
  return `${ASSET_PATH_PREFIX}${path}`;
}
