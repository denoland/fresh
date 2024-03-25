import { TailwindPluginOptions } from "./types.ts";
import { initTailwind } from "./compiler.ts";
import { DevApp } from "../../dev/dev_app.ts";
import { Processor } from "npm:postcss@8.4.35";

export function tailwind<T>(
  app: DevApp<T>,
  options: TailwindPluginOptions = {},
): void {
  let processor: Processor | null = null;

  app.onTransformStaticFile({ filter: /\.css$/ }, async (args) => {
    if (processor === null) {
      processor = await initTailwind(app.config, options);
    }
    const res = await processor.process(args.text, {
      from: args.path,
    });

    return {
      content: res.content,
      map: res.map?.toString(),
    };
  });
}
