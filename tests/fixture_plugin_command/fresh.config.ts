import { defineConfig } from "$fresh/server.ts";

export default defineConfig({
  plugins: [
    {
      name: "a",
      buildStart(config) {
        console.log(`Command: ${config.command}`);
      },
    },
  ],
});
