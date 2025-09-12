import type { EnvironmentConfig, ResolvedConfig } from "./config.ts";
import type { ModuleType, Plugin } from "./plugin.ts";

export interface ModuleNode {
  id: string;
  content: unknown;
  moduleType: ModuleType;
  importers: Set<ModuleNode>;
  imports: Set<ModuleNode>;
}

export class ModuleGraph {
  byId(env: string, id: string): ModuleNode | undefined {
    return undefined;
  }
  byUrl(env: string, id: string): ModuleNode | undefined {
    return undefined;
  }
}

export interface ResolvedEnvironment {
  name: string;
  config: EnvironmentConfig;
  plugins: Plugin[];
}

export interface State {
  config: ResolvedConfig;
  moduleGraph: ModuleGraph;
  environments: Map<string, ResolvedEnvironment>;
}
