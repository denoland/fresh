export const INTERNAL_PREFIX = "/_frsh";
export const DEV_ERROR_OVERLAY_URL = `${INTERNAL_PREFIX}/error_overlay`;
export const ALIVE_URL = `${INTERNAL_PREFIX}/alive`;
export const PARTIAL_SEARCH_PARAM = "fresh-partial";

export const SECOND = 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;
export const WEEK = DAY * 7;

export const ASSET_CACHE_BUST_KEY = "__frsh_c";

export const UPDATE_INTERVAL = DAY;

export const TEST_FILE_PATTERN = /[._]test\.(?:[tj]sx?|[mc][tj]s)$/;
