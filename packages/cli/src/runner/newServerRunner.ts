import type { DevServerInstance } from "../DevServerInstance.ts";
import type { RunnerHost } from "./connection.ts";
import { ModuleRunner } from "./module_runner.ts";
import type { ModuleInstance } from "./shared.ts";

export function newServerRunner(
  ctx: DevServerInstance,
  envName: string,
): RunnerHost {
  const runner = new ModuleRunner();

  return {
    instantiateModule(id, code) {
    },
    async loadModule(id: string): Promise<ModuleInstance> {
      const mod = await ctx.fetchModule(envName, id);
      if (mod === undefined) {
        throw new Error(`Could not instantiate ${id}`);
      }

      const instance = await runner.instantiate(
        mod.id,
        // deno-lint-ignore no-explicit-any
        mod.content as any,
        async (id) => {
          const mod = await ctx.fetchModule(envName, id);
          if (mod === undefined) {
            throw new Error(`Could not fetch ${id}`);
          }

          return { id, code: mod.content as any };
        },
      );

      return instance;
    },
  };
}
