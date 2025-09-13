import type { Plugin } from "./plugin.ts";

export type Mode = "development" | "production";
export type Command = "build" | "serve";

export interface Config {
  root?: string;
  environments?: Record<string, EnvironmentConfig>;
  plugins?: Plugin[];
}

export interface EnvironmentConfig {
  build: {
    outDir?: string;
  };
}

export interface ResolvedConfig {
  root: string;
  environments: Record<string, EnvironmentConfig>;
}

export function defineConfig(config: Config): Config {
  return config;
}
