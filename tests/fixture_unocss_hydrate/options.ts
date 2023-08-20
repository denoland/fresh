import { FreshOptions } from "$fresh/server.ts";
import unocssPlugin, { type Config } from "$fresh/plugins/unocss.ts";
import unocssConfig from "./uno.config.ts";

export default {
  plugins: [unocssPlugin(unocssConfig as Config)],
} as FreshOptions;
