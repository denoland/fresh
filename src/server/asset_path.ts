import { BUILD_ID } from "./build_id.ts";

export const INTERNAL_PREFIX = "/_frsh";
export const JS_PREFIX = `/js`;

export let INTERNAL_ASSET_PATH_PREFIX =
  `${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}`;
export function setInternalAssetPathPrefix(
  pathPrefix: string,
) {
  INTERNAL_ASSET_PATH_PREFIX = pathPrefix;
}

export let STATIC_ASSET_PATH_PREFIX = "";
export function setStaticAssetPathPrefix(pathPrefix: string) {
  STATIC_ASSET_PATH_PREFIX = pathPrefix;
}
