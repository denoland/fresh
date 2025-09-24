import * as semver from "@std/semver";
import * as path from "@std/path";

/**
 * Lightweight Deno version warning facility for Fresh.
 *
 * Two scenarios:
 *  1. Outdated stable build: warn that issues should be re-tested on latest.
 *  2. Canary build: friendly message encouraging feedback.
 *
 * This intentionally does NOT replicate Deno CLI's full update logic – we only
 * fetch the small plaintext file `https://dl.deno.land/release-latest.txt` to
 * learn the latest stable version (cached for 24h). For canary builds we don't
 * fetch anything; the presence of build metadata (a "+" suffix) in
 * `Deno.version.deno` is enough.
 */

export interface DenoVersionCacheFile {
  last_checked: string; // ISO timestamp
  latest_stable: string; // semantic version without leading v
}

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h
const CACHE_FILENAME = "deno_version.json";

let scheduled = false; // Ensure we only schedule once per process.

function getHomeDir(): string | null {
  switch (Deno.build.os) {
    case "linux": {
      const xdg = Deno.env.get("XDG_CACHE_HOME");
      if (xdg) return xdg;
      const home = Deno.env.get("HOME");
      if (home) return `${home}/.cache`;
      break;
    }
    case "darwin": {
      const home = Deno.env.get("HOME");
      if (home) return `${home}/Library/Caches`;
      break;
    }
    case "windows":
      return Deno.env.get("LOCALAPPDATA") ?? null;
  }
  return null;
}

function getFreshCacheDir(): string | null {
  const home = getHomeDir();
  if (home) return path.join(home, "fresh");
  return null;
}

async function fetchLatestStableVersion(): Promise<string> {
  const res = await fetch("https://dl.deno.land/release-latest.txt");
  if (!res.ok) throw new Error("failed to fetch latest Deno version");
  // Remove a leading v if present.
  return (await res.text()).trim().replace(/^v/, "");
}

function parseCurrentVersion(): string {
  return Deno.version.deno;
}

/** Detect if current version is canary. Canary builds have build metadata suffix like 2.x.y+<hash>. */
function isCanary(version: string): boolean {
  return version.includes("+");
}

interface CheckOptions {
  intervalMs?: number;
  getCacheDir?: () => string | null;
  getLatestStable?: () => Promise<string>;
  getCurrentVersion?: () => string;
  now?: () => Date;
  logger?: Pick<typeof console, "warn">;
  force?: boolean; // run even if env vars would normally skip
}

/**
 * Run the version warning logic. Exported for testing; typical usage is via
 * {@link scheduleDenoVersionWarning} which runs this in the background.
 */
export async function denoVersionWarning(options: CheckOptions = {}) {
  const {
    intervalMs = DEFAULT_INTERVAL_MS,
    getCacheDir = getFreshCacheDir,
    getLatestStable = fetchLatestStableVersion,
    getCurrentVersion = parseCurrentVersion,
    now = () => new Date(),
    logger = console,
    force = false,
  } = options;

  if (!force) {
    if (
      Deno.env.get("CI") === "true" ||
      Deno.env.get("DENO_DEPLOYMENT_ID") ||
      Deno.env.get("FRESH_NO_DENO_VERSION_WARNING") === "true"
    ) {
      return;
    }
  }

  const current = getCurrentVersion();

  // Canary: friendly info (only once per process; no network fetch).
  if (isCanary(current)) {
    // For unit tests we always log. In production limit to once.
    const marker = denoVersionWarning as unknown as { _canaryShown: boolean };
    if (!marker._canaryShown) {
      marker._canaryShown = true;
      logger.warn(
        "🍋 %c[INFO] Canary Deno version detected: %s – If you encounter issues please open an issue at https://github.com/denoland/deno or https://github.com/denoland/fresh",
        "color:rgb(121, 200, 121)",
        current,
      );
    }
    return;
  }

  const cacheDir = getCacheDir();
  if (!cacheDir) return; // Nothing we can do.
  const filePath = path.join(cacheDir, CACHE_FILENAME);

  let cache: DenoVersionCacheFile = {
    last_checked: new Date(0).toISOString(),
    latest_stable: current,
  };
  try {
    const text = await Deno.readTextFile(filePath);
    cache = JSON.parse(text) as DenoVersionCacheFile;
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) throw err;
  }

  const lastChecked = new Date(cache.last_checked).getTime();
  const nowMs = now().getTime();
  if (nowMs >= lastChecked + intervalMs) {
    try {
      cache.latest_stable = await getLatestStable();
      cache.last_checked = now().toISOString();
    } catch (_err) {
      // Silently ignore network issues – purely advisory.
      return;
    }
  }

  const currentSemver = semver.parse(current);
  const latestSemver = semver.parse(cache.latest_stable);
  if (currentSemver && latestSemver && semver.lessThan(currentSemver, latestSemver)) {
    logger.warn(
      "🍋 %c[WARNING] Outdated Deno version detected: %s (latest %s). Please re-test with the latest Deno before reporting issues to Fresh. Upgrade by running: deno upgrade",
      "color:rgb(251, 184, 0)",
      current,
      cache.latest_stable,
    );
  }

  try {
    await Deno.mkdir(cacheDir, { recursive: true });
    await Deno.writeTextFile(filePath, JSON.stringify(cache));
  } catch (_err) {
    // Ignore write failures.
  }
}

// For testing – track whether canary message has been shown.
(denoVersionWarning as unknown as { _canaryShown: boolean })._canaryShown = false;

/** Schedule the warning logic to run without blocking startup. */
export function scheduleFreshDenoVersionWarning() {
  if (scheduled) return;
  scheduled = true;
  // Fire and forget – keep micro delay to avoid impacting synchronous startup logs.
  queueMicrotask(() => {
    // Deliberately not awaited.
    denoVersionWarning().catch(() => {});
  });
}

// Internal state property declaration for TypeScript.
// Re-export the marker property type for tests without using namespaces.
export const _internal = { get canaryShown() { return (denoVersionWarning as unknown as { _canaryShown: boolean })._canaryShown; } };
