import type { Config, ResolvedConfig } from "./config.ts";
import type { ModuleGraph } from "./state.ts";

export type ModuleType =
  | "js"
  | "jsx"
  | "cjs"
  | "mjs"
  | "ts"
  | "tsx"
  | "json"
  | "text"
  | "bytes"
  | "css"
  | "sass"
  | "less"
  | "yaml"
  | "toml"
  | "html"
  | "md"
  | "svg";

export interface ConfigEnv {
  command: "build" | "serve";
}

export interface HookOptions {
  ssr: boolean;
}

export type FilterId = string | RegExp | RegExp[];
export interface HookFilter {
  id?: FilterId;
  moduleType?: ModuleType;
}

export interface PluginContext {
}

export interface ResolveResult {
  id: string;
  external?: boolean;
}

export type ResolveFn = (
  this: PluginContext,
  id: string,
  importer: string | null,
  options: HookOptions,
) => Promise<ResolveResult | void> | ResolveResult | void;

export interface HookWithFilter<T> {
  filter: HookFilter;
  handle: T;
}

export type ResolveHook = ResolveFn | HookWithFilter<ResolveFn>;

export interface LoadResult {
  code: string | Uint8Array;
  moduleType?: ModuleType;
}

export type LoadFn = (
  this: PluginContext,
  id: string,
  options: HookOptions,
) => Promise<LoadResult | void> | LoadResult | void;

export type LoadHook = LoadFn | HookWithFilter<LoadFn>;

export interface TransformResult {
}

export type TransformFn = (
  this: PluginContext,
  code: string,
  options: HookOptions,
) => Promise<TransformResult | void> | TransformResult | void;

export type TransformHook = TransformFn | HookWithFilter<TransformFn>;

export interface ApplyEnvOptions {
  name: string;
}

export type Middleware = (
  req: Request,
  next: () => Promise<Response>,
) => Promise<Response> | Response;

export interface DevServer {
  address: string;
  use(middleware: Middleware): this;
  moduleGraph: ModuleGraph;
}

export interface Plugin {
  name: string;
  config?(foo: any, env: ConfigEnv): Promise<Config | void> | Config | void;
  configResolved?(config: ResolvedConfig): Promise<void> | void;
  applyToEnvironment?(env: ApplyEnvOptions): boolean;

  resolveId?: ResolveHook;
  load?: LoadHook;
  transform?: TransformHook;
  configureServer?(server: DevServer): Promise<void> | void;
}
