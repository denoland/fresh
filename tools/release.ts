import * as cl from "@std/fmt/colors";
import * as path from "@std/path";
import type { DenoJson } from "../update/src/update.ts";
import * as semver from "@std/semver";

function showHelp() {
  // deno-lint-ignore no-console
  console.log(`
  Usage: deno -A release.ts <major|minor|patch|...>
`);
}

function exitError(msg: string): never {
  // deno-lint-ignore no-console
  console.error(cl.red(msg));
  showHelp();
  Deno.exit(1);
}

if (Deno.args.length === 0) {
  exitError(`Missing version argument.`);
} else if (Deno.args.length > 1) {
  exitError(`Too many arguments. Expected only one release argument`);
}

const ROOT_DIR = path.join(import.meta.dirname!, "..");
const denoJsonPath = path.join(ROOT_DIR, "deno.json");
const denoJson = JSON.parse(await Deno.readTextFile(denoJsonPath)) as DenoJson;

const version = Deno.args[0];
const current = semver.parse(denoJson.version!);
const next = semver.parse(denoJson.version!);
if (version === "major") {
  if (next.prerelease) {
    next.prerelease = undefined;
  } else {
    next.major++;
  }
} else if (version === "minor") {
  next.minor++;
} else if (version === "patch") {
  next.patch++;
} else {
  if (!next.prerelease) {
    exitError(`Unknown prelease version`);
  }

  if (next.prerelease[0] === version) {
    ((next.prerelease[1]) as number)++;
  } else {
    next.prerelease[0] = version;
    next.prerelease[1] = 1;
  }
}

const initJsonPath = path.join(ROOT_DIR, "init", "deno.json");
const initJson = JSON.parse(await Deno.readTextFile(initJsonPath));
const currentInit = semver.parse(initJson.version);

const updateJsonPath = path.join(ROOT_DIR, "update", "deno.json");
const updateJson = JSON.parse(await Deno.readTextFile(updateJsonPath));
const currentUpdate = semver.parse(updateJson.version);

function formatUpgradeMsg(
  name: string,
  from: semver.SemVer,
  to: semver.SemVer,
): string {
  const nameMsg = cl.yellow(name);
  const fromMsg = cl.green(semver.format(from));
  const toMsg = cl.yellow(semver.format(to));

  return `  ${nameMsg}: ${fromMsg} -> ${toMsg}`;
}

// deno-lint-ignore no-console
console.log(formatUpgradeMsg(denoJson.name!, current, next));
// deno-lint-ignore no-console
console.log(formatUpgradeMsg(initJson.name!, currentInit, next));
// deno-lint-ignore no-console
console.log(formatUpgradeMsg(updateJson.name!, currentUpdate, next));

if (!confirm("Proceed with update?")) {
  Deno.exit(0);
}

const denoTailwindJson = JSON.parse(
  await Deno.readTextFile(
    path.join(ROOT_DIR, "plugin-tailwindcss", "deno.json"),
  ),
) as DenoJson;

async function replaceInFile(
  file: string,
  replacer: (content: string) => string,
) {
  const raw = await Deno.readTextFile(file);
  const replaced = replacer(raw);
  await Deno.writeTextFile(file, replaced);
}

const nextVersion = semver.format(next);

function replaceJsonVersion(version: string) {
  return (content: string) =>
    content.replace(/"version":\s"[^"]+"/, `"version": "${version}"`);
}
await replaceInFile(denoJsonPath, replaceJsonVersion(nextVersion));
await replaceInFile(initJsonPath, replaceJsonVersion(nextVersion));
await replaceInFile(updateJsonPath, replaceJsonVersion(nextVersion));

async function getNpmVersion(name: string) {
  const res = await fetch(`https://registry.npmjs.org/${name}`, {
    headers: {
      "Accept":
        "application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*",
    },
  });
  const json = await res.json();
  return json["dist-tags"].latest;
}

const [preactVersion, preactSignalsVersion] = await Promise.all([
  getNpmVersion("preact"),
  getNpmVersion("@preact/signals"),
]);

function updateVersions(content: string): string {
  const replaced = content
    .replace(
      /FRESH_VERSION\s=\s["']([^'"]+)['"]/g,
      `FRESH_VERSION = "${nextVersion}"`,
    )
    .replace(
      /FRESH_TAILWIND_VERSION\s=\s["']([^'"]+)['"]/g,
      `FRESH_TAILWIND_VERSION = "${denoTailwindJson.version!}"`,
    )
    .replace(
      /PREACT_VERSION\s=\s["']([^'"]+)['"]/g,
      `PREACT_VERSION = "${preactVersion!}"`,
    )
    .replace(
      /PREACT_SIGNALS_VERSION\s=\s["']([^'"]+)['"]/g,
      `PREACT_SIGNALS_VERSION = "${preactSignalsVersion!}"`,
    );

  if (content === replaced) {
    exitError(`Did not find FRESH_VERSION string`);
  }

  return replaced;
}

const updateScriptPath = path.join(ROOT_DIR, "update", "src", "update.ts");
await replaceInFile(updateScriptPath, updateVersions);

const initScriptPath = path.join(ROOT_DIR, "init", "src", "init.ts");
await replaceInFile(initScriptPath, updateVersions);
