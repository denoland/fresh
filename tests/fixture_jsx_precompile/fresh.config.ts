import { defineConfig, Plugin } from "$fresh/server.ts";
import twind from "$fresh/plugins/twind.ts";
import twindv1 from "$fresh/plugins/twindv1.ts";

const plugins: Plugin[] = [];
const twindEnv = Deno.env.get("FRESH_FIXTURE_TWIND");
if (twindEnv === "0.x") {
  plugins.push(twind({ selfURL: import.meta.url }));
} else if (twindEnv === "1.x") {
  plugins.push(twindv1({
    selfURL: import.meta.url,
    // deno-lint-ignore no-explicit-any
  } as any));
}

export default defineConfig({
  plugins,
});
