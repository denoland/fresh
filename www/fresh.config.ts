import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";

export default defineConfig({
  build: {
    target: "safari12",
  },
  plugins: [tailwind()],
});
