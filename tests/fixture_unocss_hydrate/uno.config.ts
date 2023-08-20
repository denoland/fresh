import { defineConfig } from "$fresh/plugins/unocss.ts";
import presetUno from "https://esm.sh/@unocss/preset-uno@0.55.1";

export default defineConfig({
  presets: [presetUno()],
  selfURL: import.meta.url
});
