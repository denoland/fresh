import type { EnvironmentConfig, ResolvedConfig } from "./config.ts";
import type {
  HookFilter,
  Loader,
  LoadFn,
  Plugin,
  ResolveFn,
  SealFn,
  TransformFn,
} from "./plugin.ts";
import type { RunnerHost } from "./runner/connection.ts";
import type { ModuleId } from "./runner/shared.ts";

export class ModuleNode {
  file: string | undefined;

  constructor(
    public id: string,
    public environment: string,
    public content: unknown,
    public loader: Loader,
  ) {}

  importers = new Set<ModuleNode>();
  dynamicImporters = new Set<ModuleNode>();
  imports = new Set<ModuleNode>();
  dynamicImports = new Set<ModuleNode>();
}

export type AllModuleNode = ModuleNode;

export class ModuleGraph {
  #byId = new Map<ModuleId, ModuleNode>();
  #byUrl = new Map<string, ModuleNode>();

  byId(env: string, id: string): ModuleNode | undefined {
    return undefined;
  }
  byUrl(env: string, id: string): ModuleNode | undefined {
    return undefined;
  }

  add(env: string, mod: ModuleNode): void {
  }

  delete(env: string, id: string): void {
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

export interface InternalSealFn {
  name: string;
  filter: HookFilter;
  fn: SealFn;
}

export interface ResolvedEnvironment {
  name: string;
  config: EnvironmentConfig;
  plugins: Plugin[];
  resolvers: Resolver[];
  loaders: InternalLoaderFn[];
  transformers: InternalTransformFn[];
  finalizers: InternalSealFn[];
  runner: RunnerHost;
}

export interface State {
  config: ResolvedConfig;
  moduleGraph: ModuleGraph;
  environments: Map<string, ResolvedEnvironment>;
}
