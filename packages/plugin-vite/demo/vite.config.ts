import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import inspect from "vite-plugin-inspect";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    inspect(),
    fresh({
      islandSpecifiers: ["@marvinh-test/fresh-island"],
    }),
    tailwind(),
  ],
  future: "warn",
});
