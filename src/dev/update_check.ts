import { colors, join } from "./deps.ts";

interface CheckFile {
  last_checked: string;
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

export async function updateCheck(
  interval: number,
  getCacheDir = getFreshCacheDir,
  getLatestVersion = fetchLatestVersion,
) {
  // Skip update checks on CI or Deno Deploy
  const FRESH_NO_UPDATE_CHECK = Deno.env.get("FRESH_NO_UPDATE_CHECK");
  if (
    Deno.env.get("CI") === "true" || FRESH_NO_UPDATE_CHECK === "true" ||
    FRESH_NO_UPDATE_CHECK === "1" ||
    Deno.env.get("DENO_DEPLOYMENT_ID")
  ) {
    return;
  }

  // Abort if we couldn't find a deno_dir
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

  const versions = (await import("../../versions.json", {
    "assert": { type: "json" },
  })).default as string[];
  if (!versions.length) {
    return;
  }

  let checkFile: CheckFile = {
    current_version: versions[0],
    latest_version: versions[0],
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

  // Only check in the specificed interval
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

  if (checkFile.current_version !== checkFile.latest_version) {
    const current = colors.bold(colors.rgb8(checkFile.current_version, 208));
    const latest = colors.bold(colors.rgb8(checkFile.latest_version, 121));
    console.log(
      `    Fresh ${latest} is available. You're on ${current}`,
    );
    console.log(
      colors.dim(
        `    To upgrade, run: `,
      ) + colors.dim(`deno run -A -r https://fresh.deno.dev/update .`),
    );
    console.log();
  }

  const raw = JSON.stringify(checkFile, null, 2);
  await Deno.writeTextFile(filePath, raw);
}
