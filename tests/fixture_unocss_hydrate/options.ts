import { FreshOptions } from "$fresh/server.ts";
import unocssPlugin from "$fresh/plugins/unocss.ts";
import unocssConfig from "./uno.config.ts";
import type { UserConfig } from "https://esm.sh/@unocss/core@0.53.1";

export default {
  plugins: [unocssPlugin(unocssConfig as UserConfig)],
} as FreshOptions;
