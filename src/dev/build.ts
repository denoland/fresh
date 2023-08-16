import { ServerContext } from "../server/context.ts";
import { join } from "../server/deps.ts";

export async function build(
  ctx: ServerContext,
  outDir: string,
) {
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
