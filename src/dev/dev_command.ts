import { updateCheck } from "./update_check.ts";
import { DAY, dirname, fromFileUrl, fs, join, toFileUrl } from "./deps.ts";
import {
  FreshOptions,
  Manifest as ServerManifest,
  ServerContext,
} from "../server/mod.ts";
import { build } from "./build.ts";
import { collect, ensureMinDenoVersion, generate, Manifest } from "./mod.ts";
import { startFromContext } from "../server/boot.ts";

export async function dev(
  base: string,
  entrypoint: string,
  options: FreshOptions = {},
) {
  ensureMinDenoVersion();

  // Run update check in background
  updateCheck(DAY).catch(() => {});

  entrypoint = new URL(entrypoint, base).href;

  const dir = dirname(fromFileUrl(base));

  let currentManifest: Manifest;
  const prevManifest = Deno.env.get("FRSH_DEV_PREVIOUS_MANIFEST");
  if (prevManifest) {
    currentManifest = JSON.parse(prevManifest);
  } else {
    currentManifest = { islands: [], routes: [] };
  }
  const newManifest = await collect(dir, options);
  Deno.env.set("FRSH_DEV_PREVIOUS_MANIFEST", JSON.stringify(newManifest));

  const manifestChanged =
    !arraysEqual(newManifest.routes, currentManifest.routes) ||
    !arraysEqual(newManifest.islands, currentManifest.islands);

  if (manifestChanged) await generate(dir, newManifest);

  const manifest = (await import(toFileUrl(join(dir, "fresh.gen.ts")).href))
    .default as ServerManifest;

  const outDir = join(dir, "_fresh");

  const isBuild = Deno.args.includes("build");
  const ctx = await ServerContext.fromManifest(manifest, {
    ...options,
    skipSnapshot: true,
    dev: !isBuild,
  });

  if (isBuild) {
    // Ensure that build dir is empty
    await fs.emptyDir(outDir);
    await build(join(dir, "fresh.gen.ts"), options);
  } else if (options) {
    await startFromContext(ctx, options);
  } else {
    // Legacy entry point: Back then `dev.ts` would call `main.ts` but
    // this causes duplicate plugin instantiation if both `dev.ts` and
    // `main.ts` instantiate plugins.
    await import(entrypoint);
  }
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
