import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    fresh(),
    VitePWA({
      // Minimal configuration to generate PWA files
      registerType: "autoUpdate",
      includeAssets: [],
      manifest: {
        name: "Fresh PWA Test",
        short_name: "PWA Test",
        description: "Testing vite-plugin-pwa with Fresh",
        theme_color: "#ffffff",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html}"],
      },
    }),
  ],
});
