import type { Plugin } from "vite";
import {
  type FreshViteConfig,
  pathWithRoot,
  type ResolvedFreshViteConfig,
} from "./utils.ts";
import { deno } from "./plugins/deno.ts";
import prefresh from "@prefresh/vite";
import { serverEntryPlugin } from "./plugins/server_entry.ts";
import { clientEntryPlugin } from "./plugins/client_entry.ts";
import { devServer } from "./plugins/dev_server.ts";
import { buildIdPlugin } from "./plugins/build_id.ts";
import { clientSnapshot } from "./plugins/client_snapshot.ts";
import { serverSnapshot } from "./plugins/server_snapshot.ts";
import { fixWindowsPaths } from "./plugins/fix_windows.ts";

export function fresh(config?: FreshViteConfig): Plugin[] {
  const fConfig: ResolvedFreshViteConfig = {
    serverEntry: config?.serverEntry ?? "main.ts",
    islandsDir: config?.islandsDir ?? "islands",
    routeDir: config?.routeDir ?? "routes",
    ignore: config?.ignore ?? [],
  };

  return [
    {
      name: "fresh",
      config(config, env) {
        return {
          esbuild: {
            jsx: "automatic",
            jsxImportSource: "preact",
            jsxDev: env.command === "serve",
          },
          resolve: {
            alias: {
              "react-dom/test-utils": "preact/test-utils",
              "react-dom": "preact/compat",
              react: "preact/compat",
            },
          },

          publicDir: pathWithRoot("static", config.root),

          builder: {
            async buildApp(builder) {
              // Build client env first
              const clientEnv = builder.environments.client;
              if (clientEnv !== undefined) {
                await builder.build(clientEnv);
              }

              await Promise.all(
                Object.values(builder.environments).filter((env) =>
                  env !== clientEnv
                ).map((env) => builder.build(env)),
              );
            },
          },
          environments: {
            client: {
              build: {
                copyPublicDir: false,
                manifest: true,

                outDir: config.environments?.client?.build?.outDir ??
                  "_fresh/client",
                rollupOptions: {
                  preserveEntrySignatures: "strict",
                  input: {
                    "client-entry": "fresh:client-entry",
                    "client-snapshot": "fresh:client-snapshot",
                  },
                },
              },
            },
            ssr: {
              build: {
                manifest: true,
                copyPublicDir: false,

                outDir: config.environments?.ssr?.build?.outDir ??
                  "_fresh/server",
                rollupOptions: {
                  input: {
                    "server-entry": "fresh:server_entry",
                  },
                },
              },
            },
          },
        };
      },
      configResolved(config) {
        fConfig.islandsDir = pathWithRoot(fConfig.islandsDir, config.root);
        fConfig.routeDir = pathWithRoot(fConfig.routeDir, config.root);
      },
    },
    serverEntryPlugin(fConfig),
    ...serverSnapshot(fConfig),
    clientEntryPlugin(),
    clientSnapshot(fConfig),
    buildIdPlugin(),
    ...devServer(),
    prefresh({
      include: [/\.[cm]?[tj]sx?$/],
      exclude: [/node_modules/],
      parserPlugins: [
        "importMeta",
        "explicitResourceManagement",
        "topLevelAwait",
      ],
    }),
    fixWindowsPaths(),
    deno(),
  ];
}
