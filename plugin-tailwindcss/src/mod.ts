import { TailwindPluginOptions } from "./types.ts";
import { initTailwind } from "./compiler.ts";
import { DevApp } from "@fresh/core/dev";

export function tailwind<T>(
  app: DevApp<T>,
  options: TailwindPluginOptions = {},
): void {
  const processor = initTailwind(app.config, options);

  app.onTransformStaticFile({ filter: /\.css$/ }, async (args) => {
    const instance = await processor;
    const res = await instance.process(args.text, {
      from: args.path,
    });

    return {
      content: res.content,
      map: res.map?.toString(),
    };
  });
}
