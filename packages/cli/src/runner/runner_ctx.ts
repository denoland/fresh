import type { Middleware } from "../plugin.ts";
import {
  finalizeModule,
  loadAndTransform,
  resolveId,
} from "../plugin_container.ts";
import type { ModuleNode, State } from "../state.ts";

export class RunnerCtx {
  #state: State;
  constructor(state: State) {
    this.#state = state;
  }

  async fetchModule(
    envName: string,
    id: string,
  ): Promise<ModuleNode> {
    const env = this.#state.environments.get(envName);
    if (env === undefined) {
      throw new Error(`Unknown environment: ${envName}`);
    }

    const resolved = await resolveId(env, id, null);

    if (!resolved) {
      throw new Error(`Could not resolve ${id}`);
    }

    if (resolved.external) {
      throw new Error(`External module: ${id}`);
    }

    const loaded = await loadAndTransform(this.#state, env, resolved.id);

    const finalized = await finalizeModule(this.#state, env, loaded);

    return finalized;
  }
  use(fn: Middleware): void {
  }
}
