import type { Command, Config, Mode, ResolvedConfig } from "./config.ts";
import { type ConfigEnv, PluginBuilder } from "./plugin.ts";
import { debugPlugin } from "./plugins/debug.ts";
import { ModuleGraph, type ResolvedEnvironment, type State } from "./state.ts";

export interface BootOptions {
  command: Command;
  mode: Mode;
  debug: boolean;
}

export async function boot(
  config: Config,
  options: BootOptions,
): Promise<State> {
  const configEnv: ConfigEnv = {
    command: options.command,
    mode: options.mode,
  };

  const plugins = config.plugins ?? [];

  if (options.debug) {
    plugins.push(debugPlugin());
  }

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    if (plugin.config !== undefined) {
      const res = await plugin.config(config, configEnv);
      if (res !== undefined) {
        config = mergeConfig(config, res);
      }
    }
  }

  const resolvedConfig: ResolvedConfig = {
    root: "",
    environments: {},
  };

  const state: State = {
    config: resolvedConfig,
    environments: new Map(),
    moduleGraph: new ModuleGraph(),
  };

  for (const [name, envConfig] of Object.entries(resolvedConfig.environments)) {
    const env: ResolvedEnvironment = {
      name,
      config: envConfig,
      plugins: [],
      resolvers: [],
      loaders: [],
      transformers: [],
    };

    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];

      if (
        plugin.apply !== undefined &&
        !plugin.apply(config, {
          command: options.command,
          env: name,
          mode: options.mode,
        })
      ) {
        continue;
      }

      env.plugins.push(plugin);

      const builder = new PluginBuilder(plugin.name, env);
      await plugin.setup(builder);
    }

    state.environments.set(name, env);
  }

  return state;
}

export function mergeConfig<T>(a: T, b: T): T {
  return { ...a, ...b };
}
