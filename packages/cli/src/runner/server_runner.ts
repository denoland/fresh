import type { RunnerHost } from "./connection.ts";
import { ModuleRunner } from "./module_runner.ts";
import type { RunnerCtx } from "./runner_ctx.ts";
import type { ModuleInstance } from "./shared.ts";

export function newServerRunner(ctx: RunnerCtx, envName: string): RunnerHost {
  const runner = new ModuleRunner();

  const fetcher = async (id: string) => {
    const mod = await ctx.fetchModule(envName, id);

    // FIXME
    // deno-lint-ignore no-explicit-any
    return { id, code: mod.content as any };
  };

  return {
    async instantiateModule(id, code) {
      await runner.instantiate(id, code, fetcher);
    },
    async loadModule(id: string): Promise<ModuleInstance> {
      const mod = await fetcher(id);

      const instance = await runner.instantiate(
        mod.id,
        mod.code,
        fetcher,
      );

      return instance;
    },
  };
}
