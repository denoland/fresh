import { updateCheck } from "./update_check.ts";
import { DAY, dirname, fromFileUrl, join, toFileUrl } from "./deps.ts";
import { FreshConfig, Manifest as ServerManifest } from "../server/mod.ts";
import { build } from "./build.ts";
import { collect, ensureMinDenoVersion, generate, Manifest } from "./mod.ts";
import { startServer } from "../server/boot.ts";
import { getInternalFreshState } from "../server/config.ts";
import { getServerContext } from "$fresh/src/server/context.ts";

export async function dev(
  base: string,
  entrypoint: string,
  config?: FreshConfig,
) {
  ensureMinDenoVersion();

  // Run update check in background
  updateCheck(DAY).catch(() => {});

  const dir = dirname(fromFileUrl(base));

  let currentManifest: Manifest;
  const prevManifest = Deno.env.get("FRSH_DEV_PREVIOUS_MANIFEST");
  if (prevManifest) {
    currentManifest = JSON.parse(prevManifest);
  } else {
    currentManifest = { islands: [], routes: [] };
  }
  const newManifest = await collect(dir, config?.router?.ignoreFilePattern);
  Deno.env.set("FRSH_DEV_PREVIOUS_MANIFEST", JSON.stringify(newManifest));

  const manifestChanged =
    !arraysEqual(newManifest.routes, currentManifest.routes) ||
    !arraysEqual(newManifest.islands, currentManifest.islands);

  if (manifestChanged) await generate(dir, newManifest);

  const manifest = (await import(toFileUrl(join(dir, "fresh.gen.ts")).href))
    .default as ServerManifest;

  if (Deno.args.includes("build")) {
    const state = await getInternalFreshState(
      manifest,
      config ?? {},
    );
    state.config.dev = false;
    state.loadSnapshot = false;
    await build(state);
  } else if (config) {
    const state = await getInternalFreshState(
      manifest,
      config,
    );
    state.config.dev = true;
    state.loadSnapshot = false;
    const ctx = await getServerContext(state);
    await startServer(ctx.handler(), state.config.server);
  } else {
    // Legacy entry point: Back then `dev.ts` would call `main.ts` but
    // this causes duplicate plugin instantiation if both `dev.ts` and
    // `main.ts` instantiate plugins.
    Deno.env.set("__FRSH_LEGACY_DEV", "true");
    entrypoint = new URL(entrypoint, base).href;
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
