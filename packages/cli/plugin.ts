import type { Command, Config, Mode, ResolvedConfig } from "./config.ts";
import { DevServerInstance } from "./DevServerInstance.ts";
import type { ModuleGraph, ResolvedEnvironment } from "./state.ts";

export type Loader =
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
  | "css-module"
  | "sass"
  | "less"
  | "yaml"
  | "toml"
  | "html"
  | "md"
  | "svg";

export interface ConfigEnv {
  mode: "development" | "production";
  command: "build" | "serve";
}

export interface HookOptions {
  ssr: boolean;
}

export type FilterId = string | RegExp | RegExp[];
export interface HookFilter {
  id?: FilterId;
  moduleType?: Loader;
}

export interface ResolveResult {
  id: string;
  external?: boolean;
}

export type ResolveFn = (
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
  moduleType?: Loader;
}

export type LoadFn = (
  id: string,
  options: HookOptions,
) => Promise<LoadResult | void> | LoadResult | void;

export type LoadHook = LoadFn | HookWithFilter<LoadFn>;

export interface TransformResult {
  code: unknown;
  moduleType?: Loader;
}

export type TransformFn = (
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

export interface VitePlugin {
  name: string;
  config?(
    config: Config,
    env: ConfigEnv,
  ): Promise<Config | void> | Config | void;
  configResolved?(config: ResolvedConfig): Promise<void> | void;
  applyToEnvironment?(env: ApplyEnvOptions): boolean;

  resolveId?: ResolveHook;
  load?: LoadHook;
  transform?: TransformHook;
  configureServer?(server: DevServer): Promise<void> | void;
}

export interface Plugin {
  name: string;
  enforce?: "pre" | "post";
  apply?: (
    config: Config,
    opts: { command: Command; env: string; mode: Mode },
  ) => boolean;
  config?(
    config: Config,
    env: ConfigEnv,
  ): Promise<Config | void> | Config | void;
  setup(ctx: PluginBuilder): Promise<void> | void;
}

export interface ResolveEvent {
  type: "resolve";
  plugin: string;
  env: string;
  id: string;
  importer: string | null;
  result: ResolveResult;
  durationMs: number;
}
export interface LoadEvent {
  type: "load";
  plugin: string;
  env: string;
  id: string;
  result: LoadResult;
  durationMs: number;
}

export interface TransformEvent {
  type: "transform";
  plugin: string;
  env: string;
  id: string;
  result: TransformResult;
  durationMs: number;
}

export interface PluginEventMap {
  resolve: ResolveEvent;
  load: LoadEvent;
  transform: TransformEvent;
}

export class PluginBuilder {
  #env: ResolvedEnvironment;
  mode: Mode;
  command: Command;
  debug = false;
  #events = {
    resolve: [],
    load: [],
    transform: [],
  } as { [K in keyof PluginEventMap]: Array<(ev: PluginEventMap[K]) => void> };

  constructor(
    public name: string,
    env: ResolvedEnvironment,
    public server: DevServerInstance | null,
  ) {
    this.#env = env;
    this.mode = "development";
    this.command = "serve";
  }

  on<T extends keyof PluginEventMap>(
    event: T,
    fn: (event: PluginEventMap[T]) => void,
  ): void {
    this.#events[event].push(fn);
  }

  onResolve(
    filter: HookFilter,
    fn: (args: any) => Promise<ResolveResult | void> | ResolveResult | void,
  ): void {
    this.#env.resolvers.push({ name: this.name, filter, fn });
  }

  onLoad(
    filter: HookFilter,
    fn: (args: any) => Promise<LoadResult | void> | LoadResult | void,
  ): void {
    this.#env.loaders.push({ name: this.name, filter, fn });
  }

  onTransform(
    filter: HookFilter,
    fn: (args: any) => Promise<TransformResult | void> | TransformResult | void,
  ): void {
    this.#env.transformers.push({ name: this.name, filter, fn });
  }
}
