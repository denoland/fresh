import { updateCheck } from "$fresh/src/dev/update_check.ts";
import { DAY } from "$fresh/src/dev/deps.ts";

// deno-lint-ignore require-await
async function getLatestVersion() {
  console.log("fetching latest version");
  return Deno.env.get("LATEST_VERSION") ?? "99.99.999";
}

// deno-lint-ignore require-await
async function getCurrentVersion() {
  return Deno.env.get("CURRENT_VERSION")!;
}

const interval = +(Deno.env.get("UPDATE_INTERVAL") ?? DAY);
await updateCheck(
  interval,
  () => Deno.env.get("TEST_HOME")!,
  getLatestVersion,
  Deno.env.has("CURRENT_VERSION") ? getCurrentVersion : undefined,
);
