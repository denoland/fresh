import type { FreshBuilder } from "fresh/dev";
import type { App } from "fresh";
import twPostcss from "@tailwindcss/postcss";
import postcss from "postcss";
import type { TailwindPluginOptions } from "./types.ts";

// Re-export types for public API
export type { TailwindPluginOptions } from "./types.ts";

export async function tailwind<T>(
  builder: FreshBuilder,
  app: App<T>,
  options: TailwindPluginOptions = {},
): Promise<void> {
  const { exclude, ...tailwindOptions } = options;
  const instance = await postcss(twPostcss({
    optimize: app.config.mode === "production",
    ...tailwindOptions,
  }));

  builder.onTransformStaticFile(
    { pluginName: "tailwind", filter: /\.css$/, exclude },
    async (args) => {
      const res = await instance.process(args.text, {
        from: args.path,
      });
      return {
        content: res.content,
        map: res.map?.toString(),
      };
    },
  );
}