import { getServerContext } from "../server/context.ts";
import { join } from "../server/deps.ts";
import { fs } from "./deps.ts";
import { BuildSnapshotJson } from "../build/mod.ts";
import { BUILD_ID } from "../server/build_id.ts";
import { InternalFreshOptions } from "../server/types.ts";

export async function build(
  config: InternalFreshOptions,
) {
  // Ensure that build dir is empty
  await fs.emptyDir(config.build.outDir);

  await Promise.all(config.plugins.map((plugin) => plugin.buildStart?.()));

  // Bundle assets
  const ctx = await getServerContext(config);
  const snapshot = await ctx.buildSnapshot();

  // Write output files to disk
  await Promise.all(snapshot.paths.map(async (fileName) => {
    const data = await snapshot.read(fileName);
    if (data === null) return;

    return Deno.writeFile(join(config.build.outDir, fileName), data);
  }));

  // Write dependency snapshot file to disk
  const jsonSnapshot: BuildSnapshotJson = {
    build_id: BUILD_ID,
    files: {},
  };
  for (const filePath of snapshot.paths) {
    const dependencies = snapshot.dependencies(filePath);
    jsonSnapshot.files[filePath] = dependencies;
  }

  const snapshotPath = join(config.build.outDir, "snapshot.json");
  await Deno.writeTextFile(snapshotPath, JSON.stringify(jsonSnapshot, null, 2));

  await Promise.all(config.plugins.map((plugin) => plugin.buildEnd?.()));
}
