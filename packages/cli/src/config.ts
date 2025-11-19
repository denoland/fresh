import type { UserConfig } from "vite";

export interface Config {
  vite?: UserConfig;
}

export interface ResolvedConfig {
  vite: UserConfig;
}

export async function parseConfig(configPath: string): Config {
  return null as any;
}

export interface FreshServerEntryMod {
  default: {
    fetch(req: Request): Promise<Response>;
  };
}
