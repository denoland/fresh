import {
  type Command,
  type Config,
  mergeConfig,
  type Mode,
  type ResolvedConfig,
} from "./config.ts";
import { type ConfigEnv, PluginBuilder } from "./plugin.ts";
import { debugPlugin } from "./plugins/debug/debug.ts";
import { htmlPlugin } from "./plugins/debug/html.ts";
import { newBrowserRunner } from "./runner/browser/browser_host.ts";
import type { RunnerHost } from "./runner/connection.ts";
import { RunnerCtx } from "./runner/runner_ctx.ts";
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
    root: config.root ?? options.cwd,
    environments: config.environments ?? {},
    plugins,
  };

  plugins.push(htmlPlugin());

  console.log(config);
  console.log(resolvedConfig);

  const state: State = {
    config: resolvedConfig,
    environments: new Map(),
    moduleGraph: new ModuleGraph(),
  };

  for (const [name, envConfig] of Object.entries(resolvedConfig.environments)) {
    const runnerCtx = new RunnerCtx(state);

    let runner: RunnerHost;
    if (envConfig.runner) {
      runner = await envConfig.runner(runnerCtx, name);
    } else if (name === "client") {
      runner = await newBrowserRunner(runnerCtx, name);
    } else if (name === "ssr") {
      runner = await newServerRunner(runnerCtx, name);
    } else {
      throw new Error(`No runner defined for environment: ${name}`);
    }

    const env: ResolvedEnvironment = {
      name,
      config: envConfig,
      plugins: [],
      resolvers: [],
      loaders: [],
      transformers: [],
      finalizers: [],
      runner,
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

      const builder = new PluginBuilder(plugin.name, env, state.server);
      await plugin.setup(builder);
    }

    state.environments.set(name, env);
  }

  return state;
}
