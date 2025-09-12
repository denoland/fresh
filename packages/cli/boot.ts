import type { Config, ResolvedConfig } from "./config.ts";
import type { ApplyEnvOptions, ConfigEnv } from "./plugin.ts";
import { ModuleGraph, type ResolvedEnvironment, type State } from "./state.ts";

export async function boot(config: Config): Promise<State> {
  const configEnv: ConfigEnv = {
    command: "serve",
  };

  const plugins = config.plugins ?? [];

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    if (plugin.config !== undefined) {
      const res = await plugin.config(null, configEnv);
      if (res !== undefined) {
        config = mergeConfig(config, res);
      }
    }
  }

  let resolvedConfig: ResolvedConfig = {
    root: "",
    environments: {},
    plugins: [],
  };

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    if (plugin.configResolved !== undefined) {
      const res = await plugin.configResolved(resolvedConfig);
      if (res !== undefined) {
        resolvedConfig = mergeConfig(resolvedConfig, res);
      }
    }
  }

  const state: State = {
    config: resolvedConfig,
    environments: new Map(),
    moduleGraph: new ModuleGraph(),
  };

  for (const [name, envConfig] of Object.entries(resolvedConfig.environments)) {
    const envOption: ApplyEnvOptions = { name };

    const envState: ResolvedEnvironment = {
      name,
      config: envConfig,
      plugins: [],
    };

    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];

      if (plugin.applyToEnvironment !== undefined) {
        const res = plugin.applyToEnvironment(envOption);
        if (res) {
          envState.plugins.push(plugin);
        }
      }
    }

    state.environments.set(name, envState);
  }

  return state;
}

export function mergeConfig<T>(a: T, b: T): T {
  return { ...a, ...b };
}
