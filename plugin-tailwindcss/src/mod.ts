import type { TailwindPluginOptions } from "./types.ts";
import { initTailwind } from "./compiler.ts";
import type { Builder } from "@fresh/core/dev";
import type { App } from "@fresh/core";

export function tailwind<T>(
  builder: Builder,
  app: App<T>,
  options: TailwindPluginOptions = {},
): void {
  const processor = initTailwind(app.config, options);

  builder.onTransformStaticFile(
    { pluginName: "tailwind", filter: /\.css$/ },
    async (args) => {
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
