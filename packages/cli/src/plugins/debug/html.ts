import type { Plugin } from "../../plugin.ts";
import { type DefaultTreeAdapterTypes, parse } from "parse5";

export function htmlPlugin(): Plugin {
  return {
    name: "fresh:html",
    setup(ctx) {
      ctx.onSealModule({ loader: "html" }, (args) => {
        const html = parse(args.content);

        walk(html);

        return [
          {
            id: args.id,
            content: args.content,
          },
        ];
      });
    },
  };
}

export function walk(
  node: DefaultTreeAdapterTypes.Element | DefaultTreeAdapterTypes.Document,
) {
}
