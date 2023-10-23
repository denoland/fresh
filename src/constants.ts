export const PARTIAL_SEARCH_PARAM = "fresh-partial";
export const PARTIAL_ATTR = "f-partial";
export const LOADING_ATTR = "f-loading";
export const CLIENT_NAV_ATTR = "f-client-nav";
export const DATA_KEY_ATTR = "data-fresh-key";
export const DATA_CURRENT = "data-current";
export const DATA_ANCESTOR = "data-ancestor";

export const enum PartialMode {
  REPLACE,
  APPEND,
  PREPEND,
}

export const INTERNAL_PREFIX = "/frsh";
export const ALIVE_URL = `${INTERNAL_PREFIX}/alive`;
export const DEV_CLIENT_URL = `${INTERNAL_PREFIX}/fresh_dev_client.js`;
export const ASSET_CACHE_BUST_KEY = "__frsh_c";
