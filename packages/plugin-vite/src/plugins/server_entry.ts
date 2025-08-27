import type { Manifest, Plugin } from "vite";
import {
  generateServerEntry,
  type PendingStaticFile,
  prepareStaticFile,
} from "fresh/internal-dev";
import { pathWithRoot, type ResolvedFreshViteConfig } from "../utils.ts";
import * as path from "@std/path";

export function serverEntryPlugin(
  options: ResolvedFreshViteConfig,
): Plugin {
  const modName = "fresh:server_entry";

  let serverEntry = "";
  let serverOutDir = "";
  let clientOutDir = "";
  let root = "";

  let isDev = false;

  return {
    name: "fresh:server_entry",
    applyToEnvironment(env) {
      return env.name === "ssr";
    },
    config(_, env) {
      isDev = env.command === "serve";
    },
    configResolved(config) {
      root = config.root;
      serverEntry = pathWithRoot(options.serverEntry, config.root);
      serverOutDir = pathWithRoot(
        config.environments.ssr.build.outDir,
        config.root,
      );
      clientOutDir = pathWithRoot(
        config.environments.client.build.outDir,
        config.root,
      );
    },
    resolveId(id) {
      if (id === modName) {
        return `\0${modName}`;
      }
    },
    load(id) {
      if (id !== `\0${modName}`) return;

      let code = generateServerEntry({
        root: isDev ? path.relative(serverOutDir, root) : "..",
        serverEntry: path.toFileUrl(serverEntry).href,
        snapshotSpecifier: "fresh:server-snapshot",
      });

      code += `
      
export function registerStaticFile(prepared) {
  snapshot.staticFiles.set(prepared.name, {
    name: prepared.name,
    contentType: prepared.contentType,
    filePath: prepared.filePath
  });
}
`;

      if (isDev) {
        code = `import "preact/debug";
${code}
if (import.meta.hot) import.meta.hot.accept();`;
      }

      return code;
    },
    async writeBundle(_options, bundle) {
      const manifest = bundle[".vite/manifest.json"];

      const staticFiles: PendingStaticFile[] = [];
      if (
        manifest && manifest.type === "asset" &&
        typeof manifest.source === "string"
      ) {
        const json = JSON.parse(manifest.source) as Manifest;

        for (const item of Object.values(json)) {
          if (item.assets) {
            for (let i = 0; i < item.assets.length; i++) {
              const id = item.assets[i];

              staticFiles.push({
                filePath: path.join(serverOutDir, id),
                hash: null,
                pathname: `/${id}`,
              });
            }
          }
        }
      }

      const registered = await Promise.all(staticFiles.map(async (file) => {
        const prepared = await prepareStaticFile(file, serverOutDir);
        const rel = path.relative(serverOutDir, file.filePath);
        const target = path.join(clientOutDir, rel);
        await Deno.rename(file.filePath, target);

        prepared.filePath = path.join("client", prepared.filePath);

        return `registerStaticFile(${JSON.stringify(prepared)});`;
      }));

      const outDir = path.dirname(serverOutDir);
      await Deno.writeTextFile(
        path.join(outDir, "server.js"),
        `import server, { registerStaticFile } from "./server/server-entry.mjs";

${registered.join("\n")}

export default {
  fetch: server.fetch
};
`,
      );
    },
  };
}
