import { getServerContext } from "../server/context.ts";
import { join } from "../server/deps.ts";
import { colors, fs } from "./deps.ts";
import { BuildSnapshotJson } from "../build/mod.ts";
import { BUILD_ID } from "../server/build_id.ts";
import { InternalFreshState } from "../server/types.ts";

export async function build(
  state: InternalFreshState,
) {
  const outDir = state.config.build.outDir;
  const plugins = state.config.plugins;

  // Ensure that build dir is empty
  await fs.emptyDir(outDir);

  await Promise.all(plugins.map((plugin) => plugin.buildStart?.(state.config)));

  // Bundle assets
  const ctx = await getServerContext(state);
  const snapshot = await ctx.buildSnapshot();

  // Write output files to disk
  await Promise.all(snapshot.paths.map(async (fileName) => {
    const data = await snapshot.read(fileName);
    if (data === null) return;

    return Deno.writeFile(join(outDir, fileName), data);
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

  const snapshotPath = join(outDir, "snapshot.json");
  await Deno.writeTextFile(snapshotPath, JSON.stringify(jsonSnapshot, null, 2));

  console.log(
    `Assets written to: ${colors.green(outDir)}`,
  );

  await Promise.all(plugins.map((plugin) => plugin.buildEnd?.()));
}
