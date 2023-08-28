import { toHashString } from "./deps.ts";

const deploymentId = Deno.env.get("DENO_DEPLOYMENT_ID") ||
  // For CI
  Deno.env.get("GITHUB_SHA") ||
  crypto.randomUUID();
const buildIdHash = await crypto.subtle.digest(
  "SHA-1",
  new TextEncoder().encode(deploymentId),
);

export let BUILD_ID = toHashString(buildIdHash, "hex");

export function setBuildId(buildId: string) {
  BUILD_ID = buildId;
}
