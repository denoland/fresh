import * as semver from "@std/semver";

let scheduled = false;
let fetched = false;
let latestStableCache: string | null = null;
let canaryWarned = false;

function logWarning(message: string) {
  // deno-lint-ignore no-console
  console.warn(`🍋 %c[WARNING] ${message}`, "color:rgb(251, 184, 0)");
}

function logInfo(message: string) {
  // deno-lint-ignore no-console
  console.warn(`🍋 %c[INFO] ${message}`, "color:rgb(121, 200, 121)");
}

async function fetchLatestStableVersion(): Promise<string | null> {
  if (fetched) return latestStableCache;
  fetched = true;
  try {
    const res = await fetch("https://dl.deno.land/release-latest.txt");
    if (!res.ok) return null;
    latestStableCache = (await res.text()).trim().replace(/^v/, "");
    return latestStableCache;
  } catch (_) {
    return null;
  }
}

function parseCurrentVersion(): string {
  return Deno.version.deno;
}

function isCanary(version: string): boolean {
  return version.includes("+");
}

interface CheckOptions {
  getLatestStable?: () => Promise<string | null>;
  getCurrentVersion?: () => string;
  logger?: Pick<typeof console, "warn">;
  force?: boolean;
}

/**
 * Run the version warning logic. Exported for testing; typical usage is via
 * {@link scheduleDenoVersionWarning} which runs this in the background.
 */
export async function denoVersionWarning(options: CheckOptions = {}) {
  const {
    getLatestStable = fetchLatestStableVersion,
    getCurrentVersion = parseCurrentVersion,
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

  if (isCanary(current)) {
    if (!canaryWarned) {
      canaryWarned = true;
      // Use same console styling pattern as other Fresh warnings.
      logInfo(
        `Canary Deno version detected (${current}). Feedback welcome at https://github.com/denoland/deno or https://github.com/denoland/fresh`,
      );
    }
    return;
  }

  const latest = await getLatestStable();
  if (!latest) return;

  const currentSemver = semver.parse(current);
  const latestSemver = semver.parse(latest);
  if (
    currentSemver && latestSemver &&
    semver.lessThan(currentSemver, latestSemver)
  ) {
    logWarning(
      `Outdated Deno version: ${current} (latest ${latest}). Re-test with latest before reporting issues. Run: deno upgrade`,
    );
  }
}

export function scheduleFreshDenoVersionWarning() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    denoVersionWarning().catch(() => {});
  });
}
