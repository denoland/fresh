import type { UserConfig } from "$fresh/plugins/unocss.ts";
import presetUno from "https://esm.sh/@unocss/preset-uno@0.54.2";

export default {
  presets: [presetUno()],
} satisfies UserConfig;
