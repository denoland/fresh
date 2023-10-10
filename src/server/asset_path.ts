export let ASSET_PATH_PREFIX = "";
export function setAssetPathPrefix(prefix: string) {
  ASSET_PATH_PREFIX = prefix + ASSET_PATH_PREFIX;
}
