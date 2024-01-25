import { defineConfig, Plugin } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";
import { basicPlugin } from "./basicPlugin.ts";
import { nestedPlugin } from "./plugins/nestedPlugin.ts";
import { hackyRemotePlugin } from "https://raw.githubusercontent.com/denoland/fresh/727d0e729e154323b99b319c04f9805f382949f0/tests/fixture_tailwind_remote_classes/hackyRemotePlugin.tsx";

export default defineConfig({
  plugins: [
    tailwind(),
    basicPlugin,
    nestedPlugin,
    hackyRemotePlugin as Plugin,
  ],
});
