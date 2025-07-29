import { defineConfig } from "npm:vite@^7.0.6";
import { fresh } from "../src/mod.ts";
import inspect from "vite-plugin-inspect";
// import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    inspect(),
    fresh(),
    // cloudflare()
  ],
});
