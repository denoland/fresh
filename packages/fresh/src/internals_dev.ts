export { crawlFsItem } from "./dev/fs_crawl.ts";
export { type FsAdapter, fsAdapter } from "./fs.ts";
export {
  type FsRouteFileNoMod,
  generateServerEntry,
  generateSnapshotServer,
  type IslandModChunk,
  type PendingStaticFile,
  prepareStaticFile,
  writeCompiledEntry,
} from "./dev/dev_build_cache.ts";
export { specToName } from "./dev/builder.ts";
export { pathToSpec, UniqueNamer } from "./utils.ts";
export { updateCheck } from "./dev/update_check.ts";
export { TEST_FILE_PATTERN, UPDATE_INTERVAL } from "./constants.ts";

import denoJson from "../deno.json" with { type: "json" };
export const version = denoJson.version;
