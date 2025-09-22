import type { ModuleId, ModuleInstance } from "./shared.ts";

const AsyncFunction = async function () {}.constructor as typeof Function;

export class ModuleRunner {
  #registry = new Map<ModuleId, ModuleInstance>();

  async instantiate(
    id: string,
    code: string,
    fetchModule: (id: string) => Promise<{ id: string; code: string }>,
  ): Promise<ModuleInstance> {
    console.log("INST");
    const registry = this.#registry;
    const fn = new AsyncFunction("", code);

    const loadModule = (id: string): ModuleInstance => {
      const m = registry.get(id);
      if (m === undefined) {
        throw new Error(`Unable to load module: ${id}`);
      }

      return m;
    };

    const lazyLoadModule = async (id: string) => {
      const mod = registry.get(id);
      if (mod === undefined) {
        const req = await fetchModule(id);
        await this.instantiate(req.id, req.code, fetchModule);
      }

      return loadModule(id);
    };

    const prev = registry.get(id);
    const instance = await fn(loadModule, lazyLoadModule, prev);
    this.#registry.set(id, instance);

    return instance;
  }
}
