import { updateCheck } from "../../src/dev/update_check.ts";
import { DAY } from "@std/datetime";

// deno-lint-ignore require-await
async function getLatestVersion() {
  // deno-lint-ignore no-console
  console.log("fetching latest version");
  return Deno.env.get("LATEST_VERSION") ?? "99.99.999";
}

function getCurrentVersion() {
  return Deno.env.get("CURRENT_VERSION")!;
}

const interval = +(Deno.env.get("UPDATE_INTERVAL") ?? DAY);
await updateCheck(
  interval,
  () => Deno.env.get("TEST_HOME")!,
  getLatestVersion,
  Deno.env.has("CURRENT_VERSION") ? getCurrentVersion : undefined,
);
