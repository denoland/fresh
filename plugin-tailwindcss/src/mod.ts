import type { FreshBuilder } from "fresh/dev";
import type { App } from "fresh";
import type { TailwindPluginOptions } from "./types.ts";
import twPostcss from "@tailwindcss/postcss";
import postcss from "postcss";

export async function tailwind<T>(
  builder: FreshBuilder,
  app: App<T>,
  options: TailwindPluginOptions = {},
): Promise<void> {
  const instance = await postcss(twPostcss({
    optimize: app.config.mode === "production",
    ...options,
  }));

  builder.onTransformStaticFile(
    { pluginName: "tailwind", filter: /\.css$/, exclude: options.exclude },
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
