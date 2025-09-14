import type { DevServerInstance } from "./DevServerInstance.ts";
import type { Plugin } from "./plugin.ts";
import type { RunnerHost } from "./runner/connection.ts";

export type Mode = "development" | "production";
export type Command = "build" | "serve";

export interface Config {
  root?: string;
  environments?: Record<string, EnvironmentConfig>;
  plugins?: Plugin[];
}

export interface EnvironmentConfig {
  build: {
    input: string[];
    outDir?: string;
  };
  plugins?: Plugin[];
  runner?: (
    server: DevServerInstance,
    envName: string,
  ) => Promise<RunnerHost> | RunnerHost;
}

export interface ResolvedConfig {
  root: string;
  environments: Record<string, EnvironmentConfig>;
  plugins: Plugin[];
}

export function defineConfig(config: Config): Config {
  return config;
}

export function mergeConfig<T>(a: T, b: T): T {
  for (const k in b) {
    // deno-lint-ignore no-explicit-any
    const aValue = a[k] as any;
    const bValue = b[k];

    if (Array.isArray(bValue)) {
      if (!Array.isArray(a[k])) {
        throw new Error(`Expected an array`);
      }

      a[k].push(...bValue);
    } else if (bValue !== null && typeof bValue === "object") {
      mergeConfig(aValue, bValue);
    }
  }

  return a;
}
