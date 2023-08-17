import type { UserConfig } from "$fresh/plugins/unocss.ts";
import presetUno from "https://esm.sh/@unocss/preset-uno@0.55.1";

export default {
  presets: [presetUno()],
} satisfies UserConfig;
