import {
  type Command,
  type Config,
  mergeConfig,
  type Mode,
  type ResolvedConfig,
} from "./config.ts";
import { DevServerInstance } from "./DevServerInstance.ts";
import { type ConfigEnv, type Plugin, PluginBuilder } from "./plugin.ts";
import { debugPlugin } from "./plugins/debug/debug.ts";
import { htmlPlugin } from "./plugins/debug/html.ts";
import { newBrowserRunner } from "./runner/browser/browser_host.ts";
import type { RunnerHost } from "./runner/connection.ts";
import { newServerRunner } from "./runner/server_runner.ts";
import { ModuleGraph, type ResolvedEnvironment, type State } from "./state.ts";

export interface BootOptions {
  cwd: string;
  command: Command;
  mode: Mode;
  debug: boolean;
}

export async function boot(
  config: Config,
  options: BootOptions,
): Promise<{ state: State; server: DevServerInstance }> {
  const configEnv: ConfigEnv = {
    command: options.command,
    mode: options.mode,
  };

  const plugins = config.plugins ?? [];

  if (options.debug) {
    plugins.push(debugPlugin());
  }

  if (config.environments !== undefined) {
    for (const [name, env] of Object.entries(config.environments)) {
      if (env.plugins !== undefined) {
        for (let i = 0; i < env.plugins.length; i++) {
          const plugin = env.plugins[i];
          plugin.apply = (_config, opts) => {
            return opts.env === name;
          };
          plugins.push(plugin);
        }
      }
    }
  }

  plugins.sort(sortPlugins);

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
    root: config.root ?? options.cwd,
    environments: config.environments ?? {},
    plugins,
  };

  plugins.push(htmlPlugin());

  console.log(resolvedConfig);

  const state: State = {
    config: resolvedConfig,
    environments: new Map(),
    moduleGraph: new ModuleGraph(),
  };

  const server = new DevServerInstance(state);
  const envPlugins = new Map<string, Plugin[]>();

  for (const [name, _env] of Object.entries(resolvedConfig.environments)) {
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

      const pluginsPerEnv = envPlugins.get(name) ?? [];
      pluginsPerEnv.push(plugin);
      envPlugins.set(name, pluginsPerEnv);
    }
  }

  for (const [name, envConfig] of Object.entries(resolvedConfig.environments)) {
    let runner: RunnerHost;
    if (envConfig.runner) {
      runner = await envConfig.runner(server, name);
    } else if (name === "client") {
      runner = await newBrowserRunner(server, name);
    } else if (name === "ssr") {
      runner = await newServerRunner(server, name);
    } else {
      throw new Error(`No runner defined for environment: ${name}`);
    }

    const env: ResolvedEnvironment = {
      name,
      config: envConfig,
      plugins: envPlugins.get(name) ?? [],
      resolvers: [],
      loaders: [],
      transformers: [],
      finalizers: [],
      runner,
    };

    for (let i = 0; i < env.plugins.length; i++) {
      const plugin = env.plugins[i];
      const builder = new PluginBuilder(plugin.name, env, server);
      await plugin.setup(builder);
    }

    state.environments.set(name, env);
  }

  return { state, server };
}

function sortPlugins(a: Plugin, b: Plugin) {
  if (a.enforce === b.enforce) return 0;
  if (a.enforce === "pre" && b.enforce !== "pre") {
    return -1;
  } else if (
    b.enforce === "pre" || a.enforce === "post" && b.enforce !== "post"
  ) {
    return 1;
  }

  return 0;
}
