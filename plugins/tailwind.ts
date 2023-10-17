import type { Plugin } from "../server.ts";
import tailwind from "npm:tailwindcss";
import postcssPlugin from "./postcss.ts";
export default function tailwindPlugin(
  css: string | string[],
  config: any,
): Plugin {
  return postcssPlugin({
    css,
    // @ts-ignore Tailwind isn't typed here
    setup: (content) => [tailwind({
      ...config,
      content: content ?? config.content,
    })],
    mode: "render",
    dest: "./static/styles",
  });
}
