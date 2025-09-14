import type { LoadResult, ResolveResult, TransformResult } from "./plugin.ts";
import type { PluginPassCtx } from "./plugin_container.ts";
import type { ModuleNode } from "./state.ts";

export function toModuleNode(
  resolved: ResolveResult,
  loaded: LoadResult,
  transformed: TransformResult,
  ctx: PluginPassCtx,
): ModuleNode {
  return {
    content: transformed as any,
    dynamicImporters: new Set(),
    dynamicImports: new Set(),
    environment: ctx.environment,
    id: resolved.id,
    importers: new Set(),
    file: undefined,
    imports: new Set(),
    loader: transformed.loader ?? loaded.loader ?? "js",
  };
}
