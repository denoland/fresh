import { TailwindPluginOptions } from "./types.ts";
import { initTailwind } from "./compiler.ts";
import { DevApp } from "../../dev/dev_app.ts";

export async function tailwind<T>(
  app: DevApp<T>,
  options: TailwindPluginOptions = {},
): Promise<void> {
  const processor = await initTailwind(app.config, options);

  app.onTransformStaticFile({ filter: /\.css$/ }, async (args) => {
    const text = await Deno.readTextFile(args.path);
    const res = await processor.process(text, {
      from: args.path,
    });

    console.log("tailwind", args.path);
    return {
      content: res.content,
      map: res.map?.toString(),
    };
  });
}
