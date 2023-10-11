import { assertEquals } from "../../tests/deps.ts";
import {
  ASSET_PATH_PREFIX,
  setAssetPathPrefix,
} from "$fresh/src/server/asset_path.ts";

Deno.test("setAssetPathPrefix", () => {
  // default is empty string
  assertEquals(ASSET_PATH_PREFIX, "");

  // value of prefix is set
  const prefix = "https://example.com";
  setAssetPathPrefix(prefix);
  assertEquals(ASSET_PATH_PREFIX, prefix);
});
