import type { Command, Config, Mode } from "./config.ts";
import type { DevServerInstance } from "./DevServerInstance.ts";
import { RunnerCtx } from "./runner/runner_ctx.ts";
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

export type FilterId = string | RegExp | RegExp[];
export interface HookFilter {
  id?: FilterId;
  loader?: Loader;
}

export interface ResolveResult {
  id: string;
  external?: boolean;
}

export interface ResolveArgs {
  id: string;
  importer: string | null;
  env: string;
}

export type ResolveFn = (
  args: ResolveArgs,
) => Promise<ResolveResult | void> | ResolveResult | void;

export interface HookWithFilter<T> {
  filter: HookFilter;
  handle: T;
}

export interface LoadResult {
  code: string | Uint8Array;
  loader?: Loader;
}

export interface LoaderArgs {
  id: string;
  env: string;
}

export type LoadFn = (
  args: LoaderArgs,
) => Promise<LoadResult | void> | LoadResult | void;

export interface TransformResult {
  code: unknown;
  loader?: Loader;
}

export interface TransformArgs {
  content: string;
  loader?: Loader;
}

export type TransformFn = (
  args: TransformArgs,
) => Promise<TransformResult | void> | TransformResult | void;

export interface SealResult {
  content: unknown;
  importers?: string[];
  dynamicImporters?: string[];
}

export interface SealArgs {
  id: string;
  attributes: Record<string, unknown>;
  content: string;
  loader?: Loader;
}

export type SealFn = (
  args: SealArgs,
) =>
  | Promise<SealResult | SealResult[] | void>
  | SealResult
  | (SealResult & { id: string })[]
  | void;

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

export interface SealEvent {
  type: "seal";
  plugin: string;
  env: string;
  id: string;
  result: SealResult;
  durationMs: number;
}

export interface PluginEventMap {
  resolve: ResolveEvent;
  load: LoadEvent;
  transform: TransformEvent;
  seal: SealEvent;
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
    seal: [],
  } as { [K in keyof PluginEventMap]: Array<(ev: PluginEventMap[K]) => void> };

  constructor(
    public name: string,
    env: ResolvedEnvironment,
    public server: RunnerCtx | null,
  ) {
    this.#env = env;
    this.mode = "development";
    this.command = "serve";
  }

  subscribe<T extends keyof PluginEventMap>(
    event: T,
    fn: (event: PluginEventMap[T]) => void,
  ): void {
    this.#events[event].push(fn);
  }

  onResolve(filter: HookFilter, fn: ResolveFn): void {
    this.#env.resolvers.push({ name: this.name, filter, fn });
  }

  onLoad(filter: HookFilter, fn: LoadFn): void {
    this.#env.loaders.push({ name: this.name, filter, fn });
  }

  onTransform(filter: HookFilter, fn: TransformFn): void {
    this.#env.transformers.push({ name: this.name, filter, fn });
  }

  onSealModule(filter: HookFilter, fn: SealFn): void {
    this.#env.finalizers.push({ name: this.name, filter, fn });
  }
}
