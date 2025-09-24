import * as semver from "@std/semver";

let scheduled = false;
let fetched = false;
let latestStableCache: string | null = null;
let canaryWarned = false;

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

  if (isCanary(current)) {
    if (!canaryWarned) {
      canaryWarned = true;
      logger.warn(
        "🍋 %c[INFO] Canary Deno version detected: %s – If you encounter issues please open an issue at https://github.com/denoland/deno or https://github.com/denoland/fresh",
        "color:rgb(121, 200, 121)",
        current,
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
    logger.warn(
      "🍋 %c[WARNING] Outdated Deno version detected: %s (latest %s). Please re-test with the latest Deno before reporting issues to Fresh. Upgrade by running: deno upgrade",
      "color:rgb(251, 184, 0)",
      current,
      latest,
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
