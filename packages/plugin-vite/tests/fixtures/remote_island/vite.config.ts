import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";

export default defineConfig({
  plugins: [fresh({
    islandSpecifiers: ["@marvinh-test/fresh-island"],
  })],
});
