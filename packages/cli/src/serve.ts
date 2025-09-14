import { boot } from "./boot.ts";
import type { Config } from "./config.ts";

export async function serve(config: Config, cwd: string) {
  const state = await boot(config, {
    cwd,
    command: "serve",
    debug: false,
    mode: "development",
  });

  return state.server!.fetch();
}
