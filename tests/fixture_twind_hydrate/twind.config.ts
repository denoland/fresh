import { defineConfig, type Preset, presetTailwind } from "../deps.ts";

export default {
  ...defineConfig({
    presets: [presetTailwind() as Preset],
  }),
  selfURL: import.meta.url,
};
