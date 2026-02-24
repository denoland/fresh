import { compile, Features } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import * as path from "node:path";

interface PluginBuild {
  onTransform(
    options: { filter: RegExp; namespace?: string },
    callback: (args: {
      text: string;
      path: string;
      namespace: string;
      loader: string;
    }) => Promise<{ text: string; loader: string } | null> | null,
  ): void;
}

interface PluginConfig {
  root?: string;
}

export default function tailwindPlugin() {
  let root = Deno.cwd();

  return {
    name: "tailwindcss",

    configResolved(config: PluginConfig) {
      root = config.root ?? root;
    },

    setup(build: PluginBuild) {
      build.onTransform({ filter: /\.css$/ }, async (args) => {
        // Quick check: skip files without Tailwind directives
        if (
          !args.text.includes("@import") &&
          !args.text.includes("@theme") &&
          !args.text.includes("@apply")
        ) {
          return null;
        }

        const base = path.dirname(args.path);
        const compiler = await compile(args.text, {
          base,
          onDependency: () => {},
        });

        // If the CSS doesn't use Tailwind features, skip it
        if (
          !(
            compiler.features &
            (Features.AtApply | Features.Utilities | Features.ThemeFunction)
          )
        ) {
          return null;
        }

        // Set up scanner sources for finding utility class candidates
        const sources = (() => {
          if (compiler.root === "none") return [];
          if (compiler.root === null) {
            return [{ base: root, pattern: "**/*", negated: false }];
          }
          return [{ ...compiler.root, negated: false }];
        })().concat(compiler.sources);

        const scanner = new Scanner({ sources });
        const candidates = scanner.scan();

        const output = compiler.build([...candidates]);
        return { text: output, loader: "css" as const };
      });
    },
  };
}
