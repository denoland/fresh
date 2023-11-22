import twind from "$fresh/plugins/twind.ts";
import twindv1 from "$fresh/plugins/twindv1.ts";
import { defineConfig, Plugin } from "$fresh/server.ts";

const plugins: Plugin[] = [];
const twindEnv = typeof Deno !== "undefined" &&
  Deno.env.get("FRESH_FIXTURE_TWIND");
if (twindEnv === "0.x") {
  plugins.push(twind({ selfURL: import.meta.url }));
} else if (twindEnv === "1.x") {
  const twindConfig = await import("./twind.config.ts");
  plugins.push(twindv1(twindConfig.default));
}

export default defineConfig({
  plugins,
});
