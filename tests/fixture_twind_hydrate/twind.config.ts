import { defineConfig } from "https://esm.sh/@twind/core@1.1.3";
import presetTailwind from "https://esm.sh/@twind/preset-tailwind@1.1.4";

export default {
  ...defineConfig({
    presets: [presetTailwind()],
  }),
  selfURL: import.meta.url,
};
