import type {
  HookFilter,
  LoadResult,
  ResolveResult,
  TransformResult,
} from "./plugin.ts";
import { ModuleId } from "./runner/shared.ts";
import { plugin } from "./scratch.ts";
import {
  InternalTransformFn,
  ModuleGraph,
  ModuleNode,
  ResolvedEnvironment,
  State,
} from "./state.ts";

export interface PluginPassCtx {
  environment: string;
}

export async function resolveId(
  env: ResolvedEnvironment,
  id: string,
  importer: string | null,
): Promise<ResolveResult | null> {
  for (let i = 0; i < env.resolvers.length; i++) {
    const resolver = env.resolvers[i];
    if (!matchFilter(resolver.filter, id)) continue;

    try {
      const resolved = await resolver.fn({ id, importer, env: env.name });
      if (resolved) {
        return resolved;
      }
    } catch (err) {
      throw new Error(`[${plugin.name}] errored when resolving ${id}`, {
        cause: err,
      });
    }
  }

  return null;
}

export function matchFilter(
  filter: HookFilter,
  id: string,
): boolean {
  return true;
}

export async function loadAndTransform(
  env: ResolvedEnvironment,
  id: string,
): Promise<LoadResult> {
  for (let i = 0; i < env.loaders.length; i++) {
    const load = env.loaders[i];

    if (!matchFilter(load.filter, id)) continue;

    console.log("load", id);

    const result = await load.fn({ env: env.name, id });
    if (result !== undefined) {
      console.log({ loaded: result });
      return await transform(env, id, result);
    }
  }

  console.log("LOAD", id);
  throw new Error(`Could not load: "${id}"`);
}

export async function transform(
  env: ResolvedEnvironment,
  id: string,
  loaded: LoadResult,
): Promise<LoadResult> {
  const seen = new Set<InternalTransformFn>();

  let current = loaded;

  for (let i = 0; i < env.transformers.length; i++) {
    const transform = env.transformers[i];
    if (seen.has(transform)) continue;

    if (!matchFilter(transform.filter, id)) continue;

    seen.add(transform);

    const result = await transform.fn({ content: current.code, id });
    if (result) {
      if (!result.loader) result.loader = current.loader;
      current = result as LoadResult;
      continue;
    }
  }

  return current;
}

export function finalizeModule(
  graph: ModuleGraph,
  env: ResolvedEnvironment,
  mod: ModuleNode,
): Promise<ModuleNode> {
  graph.add();
}

export async function processEntries(
  graph: ModuleGraph,
  env: ResolvedEnvironment,
  ids: ModuleId[],
) {
  const queue = ids.slice();

  let current: ModuleId | undefined;
  // FIXME: Concurrency
  while ((current = queue.pop()) !== undefined) {
    await processId(graph, env, current);
  }
}

export async function processId(
  graph: ModuleGraph,
  env: ResolvedEnvironment,
  id: string,
): Promise<ModuleNode> {
  const resolved = await resolveId(env, id, null);

  if (!resolved) {
    throw new Error(`Could not resolve ${id}`);
  }

  if (resolved.external) {
    throw new Error(`External module: ${id}`);
  }

  const loaded = await loadAndTransform(env, resolved.id);

  const mod = new ModuleNode(
    resolved.id,
    env.name,
    loaded.code,
    loaded.loader,
  );
  const finalized = await finalizeModule(graph, env, mod);

  console.log({ finalized });

  return finalized;
}

export async function buildEnv(env: ResolvedEnvironment) {
}
