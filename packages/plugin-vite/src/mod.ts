import { esmExternalRequirePlugin, type Plugin } from "rolldown-vite";
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
import { patches } from "./plugins/patches.ts";
import process from "node:process";
import {
  specToName,
  UniqueNamer,
  UPDATE_INTERVAL,
  updateCheck,
} from "@fresh/core/internal-dev";
import { checkImports } from "./plugins/verify_imports.ts";
import { isBuiltin } from "node:module";
import { load as stdLoadEnv } from "@std/dotenv";
import path from "node:path";

export function fresh(config?: FreshViteConfig): Plugin[] {
  const fConfig: ResolvedFreshViteConfig = {
    serverEntry: config?.serverEntry ?? "main.ts",
    clientEntry: config?.clientEntry ?? "client.ts",
    islandsDir: config?.islandsDir ?? "islands",
    routeDir: config?.routeDir ?? "routes",
    ignore: config?.ignore ?? [],
    islandSpecifiers: new Map(),
    namer: new UniqueNamer(),
    checkImports: config?.checkImports ?? [],
  };

  fConfig.checkImports.push((id, env) => {
    if (env === "client") {
      if (isBuiltin(id)) {
        return {
          type: "error",
          message: "Node built-in modules cannot be imported in the browser.",
          description:
            "This is an error in your application code or in one of its dependencies.",
        };
      }
    }
  });

  let isDev = false;

  const plugins: Plugin[] = [
    {
      name: "fresh",
      sharedDuringBuild: true,
      config(config, env) {
        isDev = env.command === "serve";

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
            // Disallow externals, because it leads to duplicate
            // modules with `preact` vs `npm:preact@*` in the server
            // environment.
            noExternal: true,
          },
          optimizeDeps: {
            // Optimize deps somehow leads to duplicate modules or them
            // being placed in the wrong chunks...
            noDiscovery: true,
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
                  },
                },
              },
            },
            ssr: {
              build: {
                manifest: true,
                emitAssets: true,
                copyPublicDir: false,

                outDir: config.environments?.ssr?.build?.outDir ??
                  "_fresh/server",
                rollupOptions: {
                  onwarn(warning, handler) {
                    // Ignore "use client"; warnings
                    if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
                      return;
                    }

                    // Ignore optional export errors
                    if (
                      warning.code === "MISSING_EXPORT" &&
                      warning.id?.startsWith("\0fresh-route::")
                    ) {
                      return;
                    }

                    // Ignore commonjs optional exports
                    if (
                      warning.code === "MISSING_EXPORT" &&
                      warning.message.includes("__require")
                    ) {
                      return;
                    }

                    return handler(warning);
                  },
                  input: {
                    "server-entry": "fresh:server_entry",
                  },
                },
              },
            },
          },
        };
      },
      async configResolved(vConfig) {
        // Run update check in background
        updateCheck(UPDATE_INTERVAL).catch(() => {});

        fConfig.islandsDir = pathWithRoot(fConfig.islandsDir, vConfig.root);
        fConfig.routeDir = pathWithRoot(fConfig.routeDir, vConfig.root);

        config?.islandSpecifiers?.map((spec) => {
          const specName = specToName(spec);
          const name = fConfig.namer.getUniqueName(specName);
          fConfig.islandSpecifiers.set(spec, name);
        });

        const envDir = pathWithRoot(
          vConfig.envDir || vConfig.root,
          vConfig.root,
        );

        await loadEnvFile(path.join(envDir, ".env"));
        await loadEnvFile(path.join(envDir, ".env.local"));
        const mode = isDev ? "development" : "production";
        await loadEnvFile(path.join(envDir, `.env.${mode}`));
        await loadEnvFile(path.join(envDir, `.env.${mode}.local`));
      },
    },
    serverEntryPlugin(fConfig),
    patches(),
    esmExternalRequirePlugin({
      external: ["preact", /^node:/],
    }),
    ...serverSnapshot(fConfig),
    clientEntryPlugin(fConfig),
    ...clientSnapshot(fConfig),
    buildIdPlugin(),
    ...devServer(),
    prefresh({
      include: [/\.[cm]?[tj]sx?$/],
      exclude: [/node_modules/, /[\\/]+deno[\\/]+npm[\\/]+/],
      parserPlugins: [
        "importMeta",
        "explicitResourceManagement",
        "topLevelAwait",
      ],
    }),
    checkImports({ checks: fConfig.checkImports }),
  ];

  if (typeof process.versions.deno === "string") {
    plugins.push(deno());
  }

  return plugins;
}

async function loadEnvFile(envPath: string) {
  try {
    await stdLoadEnv({ envPath, export: true });
  } catch {
    // Ignoe
  }
}
