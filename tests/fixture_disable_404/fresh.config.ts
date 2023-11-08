import { defineConfig } from "$fresh/server.ts";

export default defineConfig({
  router: {
    disabled404response: () => {
      return new Response("Bär");
    },
  },
});
