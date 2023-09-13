import { ServerContext } from "../server/context.ts";
import { FreshOptions, Manifest } from "../server/mod.ts";
import { dirname, fromFileUrl, join, toFileUrl } from "../server/deps.ts";
import { fs } from "./deps.ts";
import { BuildSnapshotJson } from "../build/mod.ts";
import { BUILD_ID } from "$fresh/src/server/build_id.ts";

export async function build(
  manifestPath: string,
  opts: FreshOptions,
) {
  const manifest = (await import(toFileUrl(manifestPath).href))
    .default as Manifest;

  const outDir = join(dirname(fromFileUrl(manifest.baseUrl)), "_fresh");

  // Ensure that build dir is empty
  await fs.emptyDir(outDir);

  const ctx = await ServerContext.fromManifest(manifest, {
    ...opts,
    skipSnapshot: true,
  });

  // Bundle assets
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
}
