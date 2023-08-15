import twindPlugin from "$fresh/plugins/twind.ts";
import twindConfig from "./twind.config.ts";
import { defineConfig } from "$fresh/server.ts";

export default defineConfig({
  plugins: [twindPlugin(twindConfig)],
});
