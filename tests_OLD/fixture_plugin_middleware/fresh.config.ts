import { defineConfig } from "$fresh/server.ts";
import { middlewarePlugin } from "./plugins/middleware.ts";

export default defineConfig({
  plugins: [
    middlewarePlugin(),
  ],
});
