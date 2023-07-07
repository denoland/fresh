import { colors, join } from "./deps.ts";
import { DEBUG } from "./constants.ts";

interface CheckFile {
  last_checked: string;
  latest_version: string;
  current_version: string;
}

async function getDenoDir(): Promise<string | undefined> {
  const output = await new Deno.Command("deno", { args: ["info"] }).output();
  const denoDir = colors.stripColor(new TextDecoder().decode(output.stdout))
    .split(
      /\n/g,
    ).find(
      (line) => line.startsWith("DENO_DIR"),
    )?.replace("DENO_DIR location: ", "");

  return denoDir;
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
  getLatestVersion = fetchLatestVersion,
) {
  // Skip update checks on CI or Deno Deploy
  if (Deno.env.get("CI") || Deno.env.get("FRESH_NO_UPDATE_CHECK") || !DEBUG) {
    return;
  }

  // Abort if we couldn't find a deno_dir
  const denoDir = await getDenoDir();
  if (!denoDir) {
    return;
  }

  const versions = (await import("../../versions.json", {
    "assert": { type: "json" },
  })).default as string[];
  if (!versions.length) {
    return;
  }

  const filePath = join(denoDir, "fresh-latest.json");
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
