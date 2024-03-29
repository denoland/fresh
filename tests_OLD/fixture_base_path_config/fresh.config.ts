import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";

export default defineConfig({
  router: { basePath: "/foo/bar" },
  plugins: [
    tailwind(),
  ],
});
