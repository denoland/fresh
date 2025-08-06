import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import inspect from "vite-plugin-inspect";

export default defineConfig({
  plugins: [
    inspect(),
    fresh(),
  ],
});
