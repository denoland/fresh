import { colors, join, lessThan, semverParse } from "./deps.ts";

export interface CheckFile {
  last_checked: string;
  last_shown?: string;
  latest_version: string;
  current_version: string;
}

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
  if (home) return join(home, "fresh");
  return null;
}

async function fetchLatestVersion() {
  const res = await fetch("https://dl.deno.land/fresh/release-latest.txt");
  if (res.ok) {
    return (await res.text()).trim().replace(/^v/, "");
  }

  throw new Error(`Could not fetch latest version.`);
}

async function readCurrentVersion() {
  const versions = (await import("../../versions.json", {
    with: { type: "json" },
  })).default as string[];
  return versions[0];
}

export async function updateCheck(
  interval: number,
  getCacheDir = getFreshCacheDir,
  getLatestVersion = fetchLatestVersion,
  getCurrentVersion = readCurrentVersion,
) {
  // Skip update checks on CI or Deno Deploy
  if (
    Deno.env.get("CI") === "true" ||
    Deno.env.get("FRESH_NO_UPDATE_CHECK") === "true" ||
    Deno.env.get("DENO_DEPLOYMENT_ID")
  ) {
    return;
  }

  const home = getCacheDir();
  if (!home) return;
  const filePath = join(home, "latest.json");
  try {
    await Deno.mkdir(home, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      throw err;
    }
  }

  const version = await getCurrentVersion();

  let checkFile: CheckFile = {
    current_version: version,
    latest_version: version,
    last_checked: new Date(0).toISOString(),
  };
  try {
    const text = await Deno.readTextFile(filePath);
    checkFile = JSON.parse(text);
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  // Update current version
  checkFile.current_version = version;

  // Only check in the specified interval
  if (Date.now() >= new Date(checkFile.last_checked).getTime() + interval) {
    try {
      checkFile.latest_version = await getLatestVersion();
      checkFile.last_checked = new Date().toISOString();
    } catch (err) {
      // Update check is optional and shouldn't abort the program.
      console.error(
        colors.red(`    Update check failed: `) + err.message,
      );
      return;
    }
  }

  // Only show update message if current version is smaller than latest
  const currentVersion = semverParse(checkFile.current_version);
  const latestVersion = semverParse(checkFile.latest_version);
  if (
    (!checkFile.last_shown ||
      Date.now() >= new Date(checkFile.last_shown).getTime() + interval) &&
    lessThan(currentVersion, latestVersion)
  ) {
    checkFile.last_shown = new Date().toISOString();

    const current = colors.bold(colors.rgb8(checkFile.current_version, 208));
    const latest = colors.bold(colors.rgb8(checkFile.latest_version, 121));
    console.log(
      `    Fresh ${latest} is available. You're on ${current}`,
    );
    console.log(
      `    To upgrade, run: deno run -A -r https://fresh.deno.dev/update`,
    );
    console.log();
  }

  // Migrate old format to current
  if (!checkFile.last_shown) {
    checkFile.last_shown = new Date().toISOString();
  }

  const raw = JSON.stringify(checkFile, null, 2);
  await Deno.writeTextFile(filePath, raw);
}
