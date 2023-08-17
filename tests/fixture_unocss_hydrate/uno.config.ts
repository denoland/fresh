import type { UserConfig } from "$fresh/plugins/unocss.ts";
import presetUno from "@unocss/preset-uno";

export default {
  presets: [presetUno()],
} satisfies UserConfig;
