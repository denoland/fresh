import * as semver from "@std/semver";

/**
 * Lightweight Deno version warning facility for Fresh (stateless).
 *
 * Scenarios:
 *  1. Outdated stable build → warn to re-test with latest Deno before
 *     reporting issues.
 *  2. Canary build → friendly info inviting feedback.
 *
 * No filesystem cache (edge / ephemeral FS friendly). We attempt a single
 * network fetch per process (first schedule) and swallow all errors (missing
 * net perms, offline, etc.).
 */

let scheduled = false; // Ensure we only schedule once.
let fetched = false; // Prevent repeated network fetch within same process.
let latestStableCache: string | null = null;

async function fetchLatestStableVersion(): Promise<string | null> {
  if (fetched) return latestStableCache; // Already attempted.
  fetched = true;
  try {
    const res = await fetch("https://dl.deno.land/release-latest.txt");
    if (!res.ok) return null;
    latestStableCache = (await res.text()).trim().replace(/^v/, "");
    return latestStableCache;
  } catch (_) {
    // Network disallowed or offline – ignore.
    return null;
  }
}

function parseCurrentVersion(): string {
  return Deno.version.deno;
}

/** Detect if current version is canary. Canary builds have build metadata suffix like 2.x.y+<hash>. */
function isCanary(version: string): boolean {
  return version.includes("+");
}

interface CheckOptions {
  getLatestStable?: () => Promise<string | null>;
  getCurrentVersion?: () => string;
  logger?: Pick<typeof console, "warn">;
  force?: boolean; // run even if env vars would normally skip
}

/**
 * Run the version warning logic. Exported for testing; typical usage is via
 * {@link scheduleDenoVersionWarning} which runs this in the background.
 */
export async function denoVersionWarning(options: CheckOptions = {}) {
  const {
    getLatestStable = fetchLatestStableVersion,
    getCurrentVersion = parseCurrentVersion,
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

  const latest = await getLatestStable();
  if (!latest) return; // Couldn't determine latest – stay silent.

  const currentSemver = semver.parse(current);
  const latestSemver = semver.parse(latest);
  if (currentSemver && latestSemver && semver.lessThan(currentSemver, latestSemver)) {
    logger.warn(
      "🍋 %c[WARNING] Outdated Deno version detected: %s (latest %s). Please re-test with the latest Deno before reporting issues to Fresh. Upgrade by running: deno upgrade",
      "color:rgb(251, 184, 0)",
      current,
      latest,
    );
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
