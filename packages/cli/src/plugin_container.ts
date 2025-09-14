import type { HookFilter, ResolveResult, TransformResult } from "./plugin.ts";
import { plugin } from "./scratch.ts";
import type { ModuleNode, ResolvedEnvironment, State } from "./state.ts";

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

export function matchFilter(filter: HookFilter, id: string): boolean {
  return true;
}

export function loadAndTransform(
  state: State,
  env: ResolvedEnvironment,
  id: string,
): Promise<TransformResult> {
}

export function finalizeModule(
  state: State,
  env: ResolvedEnvironment,
): Promise<ModuleNode> {
}
