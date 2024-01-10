import { FreshOptions } from "$fresh/server.ts";
import unocssPlugin from "$fresh/plugins/unocss.ts";

export default {
  plugins: [unocssPlugin()],
} as FreshOptions;
