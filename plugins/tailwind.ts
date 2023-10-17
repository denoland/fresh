import type { Plugin } from "../server.ts";
import tailwind from "npm:tailwindcss";
import postcssPlugin from "./postcss.ts";
export default function tailwindPlugin(
  css: string | string[] | Record<string, string>,
  config: any,
): Plugin {
  return postcssPlugin({
    css,
    // @ts-ignore Tailwind isn't typed here
    setup: (content) => {
      return [tailwind({
        ...config,
        content: [
          { raw: content, extension: ".html" },
          ...(config.content ?? []),
        ],
      })];
    },
    mode: "render",
    dest: "./static/styles",
  });
}
