import type { Plugin } from "vite";

export function buildIdPlugin(): Plugin {
  let buildId = "";

  const regex = /^(jsr:)?@fresh\/build-id(@.*)?$/;

  return {
    name: "fresh:build-id",
    async config(_, env) {
      const isDev = env.command === "serve";

      buildId = await getBuildId(isDev);

      return {
        define: {
          BUILD_ID: JSON.stringify(buildId),
        },
      };
    },
    applyToEnvironment() {
      return true;
    },
    resolveId(id) {
      if (regex.test(id)) {
        return `\0fresh/build-id`;
      }
    },
    load(id) {
      if (id !== `\0fresh/build-id`) return;

      return `export let BUILD_ID = ${JSON.stringify(buildId)};
export const DENO_DEPLOYMENT_ID = undefined;
export function setBuildId(id) {
  BUILD_ID = id;
}`;
    },
  };
}

export async function getBuildId(dev: boolean): Promise<string> {
  // Check for GIT_REVISION environment variable first
  const gitRevision = Deno.env.get("GIT_REVISION");
  if (gitRevision !== undefined) {
    return gitRevision;
  }

  if (!dev) {
    const bin = Deno.build.os === "windows" ? "git.exe" : "git";
    const res = await new Deno.Command(bin, { args: ["rev-parse", "HEAD"] })
      .output();

    return new TextDecoder().decode(res.stdout);
  }

  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0]);
}
