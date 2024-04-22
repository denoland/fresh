import * as semver from "@std/semver";

/**
 * Check that the minimum supported Deno version is being used.
 */
export function ensureMinDenoVersion(minVersion: string) {
  if (
    !semver.greaterOrEqual(
      semver.parse(Deno.version.deno),
      semver.parse(minVersion),
    )
  ) {
    let message =
      `Deno version ${minVersion} or higher is required. Please update Deno.\n\n`;

    if (Deno.execPath().includes("homebrew")) {
      message +=
        "You seem to have installed Deno via homebrew. To update, run: `brew upgrade deno`\n";
    } else {
      message += "To update, run: `deno upgrade`\n";
    }

    error(message);
  }
}

export function error(message: string): never {
  console.error(`%cerror%c: ${message}`, "color: red; font-weight: bold", "");
  Deno.exit(1);
}
