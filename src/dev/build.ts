import { ServerContext } from "../server/context.ts";
import { FreshOptions, Manifest } from "../server/mod.ts";
import { dirname, fromFileUrl, join, toFileUrl } from "../server/deps.ts";
import { fs } from "./deps.ts";

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
  await Promise.all(snapshot.paths.map((fileName) => {
    const data = snapshot.read(fileName);
    if (data === null) return;

    return Deno.writeFile(join(outDir, fileName), data);
  }));

  // Write dependency snapshot file to disk
  const deps: Record<string, string[]> = {};
  for (const filePath of snapshot.paths) {
    const dependencies = snapshot.dependencies(filePath);
    deps[filePath] = dependencies;
  }

  const snapshotPath = join(outDir, "snapshot.json");
  await Deno.writeTextFile(snapshotPath, JSON.stringify(deps, null, 2));
}
