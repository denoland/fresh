import type { UserConfig, ResolvedConfig } from "vite";


export  function parseConfig(config: UserConfig): ResolvedConfig {


  return {
    appType: config.appType ?? "custom",
    
  }
}

export interface FreshServerEntryMod {
  default: {
    fetch(req: Request): Promise<Response>;
  };
}
