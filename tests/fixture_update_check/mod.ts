import { updateCheck } from "$fresh/src/server/update_check.ts";

// deno-lint-ignore require-await
async function getLatestVersion() {
  console.log("fetching latest version");
  return Deno.env.get("LATEST_VERSION") ?? "1.2.0";
}

const interval = +(Deno.env.get("UPDATE_INTERVAL") ?? 1000);
await updateCheck(interval, getLatestVersion);
