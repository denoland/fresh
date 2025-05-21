import type { TailwindPluginOptions } from "./types.ts";
import { initTailwind } from "./compiler.ts";
import type { FreshBuilder } from "fresh/dev";
import type { App } from "fresh";

export function tailwind<T>(
  builder: FreshBuilder,
  app: App<T>,
  options: TailwindPluginOptions = {},
): void {
  let processor: ReturnType<typeof initTailwind> | null;

  builder.onTransformStaticFile(
    { pluginName: "tailwind", filter: /\.css$/, exclude: options.exclude },
    async (args) => {
      if (!processor) processor = initTailwind(app.config, options);
      const instance = await processor;
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
