import type { Plugin } from "./plugin.ts";

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
  plugins: Plugin[];
}

export function defineConfig(config: Config): Config {
  return config;
}
