import type { EnvironmentConfig, ResolvedConfig } from "./config.ts";
import type {
  HookFilter,
  LoadFn,
  ModuleType,
  Plugin,
  ResolveFn,
  TransformFn,
} from "./plugin.ts";

export interface ModuleNode {
  type: "module";
  id: string;
  environment: string;
  file: string | undefined;
  content: unknown;
  moduleType: ModuleType;
  importers: Set<ModuleNode>;
  dynamicImporters: Set<ModuleNode>;
  imports: Set<ModuleNode>;
  dynamicImports: Set<ModuleNode>;
}

export interface ExternalNode {
  type: "external";
  id: string;
  environment: string;
  importers: Set<ModuleNode>;
  dynamicImporters: Set<ModuleNode>;
}

export class ModuleGraph {
  byId(env: string, id: string): ModuleNode | ExternalNode | undefined {
    return undefined;
  }
  byUrl(env: string, id: string): ModuleNode | ExternalNode | undefined {
    return undefined;
  }
}

export interface Resolver {
  name: string;
  filter: HookFilter;
  fn: ResolveFn;
}

export interface InternalLoaderFn {
  name: string;
  filter: HookFilter;
  fn: LoadFn;
}

export interface InternalTransformFn {
  name: string;
  filter: HookFilter;
  fn: TransformFn;
}

export interface ResolvedEnvironment {
  name: string;
  config: EnvironmentConfig;
  plugins: Plugin[];
  resolvers: Resolver[];
  loaders: InternalLoaderFn[];
  transformers: InternalTransformFn[];
}

export interface State {
  config: ResolvedConfig;
  moduleGraph: ModuleGraph;
  environments: Map<string, ResolvedEnvironment>;
}
