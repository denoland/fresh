import { defineConfig } from "$fresh/server.ts";
import { middlewarePlugin1, middlewarePlugin2 } from "./plugins/middleware.ts";

export default defineConfig({
  plugins: [
    middlewarePlugin2(),
    middlewarePlugin1(),
  ],
  prioritizePluginMiddleware: true,
});
