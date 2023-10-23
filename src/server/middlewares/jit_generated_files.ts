import { AssetSnapshot } from "../../build/types.ts";
import { serveGeneratedFiles } from "./generated_files.ts";

/**
 * Serve generated files under `build.outDir`. They are assumed
 * to be long-lived for caching as they can only change with
 * a deployment and contain the deploy key in the URL pathname.
 */
export function serveJITGeneratedFiles(snapshot: AssetSnapshot) {
  return serveGeneratedFiles(snapshot);
}
