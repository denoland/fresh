import { defineConfig } from "$fresh/server.ts";
import twind from "$fresh/plugins/twind.ts";

export default defineConfig({
  plugins: [twind({
    selfURL: import.meta.url,
  })],
});
