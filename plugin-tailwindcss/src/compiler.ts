import tailwindCss, { type Config } from "tailwindcss";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import * as path from "@std/path";
import type { TailwindPluginOptions } from "./types.ts";
import type { ResolvedFreshConfig } from "fresh";

const CONFIG_EXTENSIONS = ["ts", "js", "mjs"];

async function findTailwindConfigFile(directory: string): Promise<string> {
  let dir = directory;
  while (true) {
    for (let i = 0; i < CONFIG_EXTENSIONS.length; i++) {
      const ext = CONFIG_EXTENSIONS[i];
      const filePath = path.join(dir, `tailwind.config.${ext}`);
      try {
        const stat = await Deno.stat(filePath);
        if (stat.isFile) {
          return filePath;
        }
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
      }
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Could not find a tailwind config file in the current directory or any parent directory.`,
      );
    }

    dir = parent;
  }
}

export async function initTailwind(
  config: ResolvedFreshConfig,
  options: TailwindPluginOptions,
): Promise<postcss.Processor> {
  const root = path.dirname(config.staticDir);

  const configPath = await findTailwindConfigFile(root);
  const url = path.toFileUrl(configPath).href;
  const tailwindConfig = (await import(url)).default as Config;

  if (!Array.isArray(tailwindConfig.content)) {
    throw new Error(`Expected tailwind "content" option to be an array`);
  }

  // deno-lint-ignore no-explicit-any
  tailwindConfig.content = tailwindConfig.content.map((pattern: any) => {
    if (typeof pattern === "string") {
      const relative = path.relative(Deno.cwd(), path.dirname(configPath));

      if (!relative.startsWith("..")) {
        return path.join(relative, pattern);
      }
    }
    return pattern;
  });

  // PostCSS types cause deep recursion
  const plugins = [
    // deno-lint-ignore no-explicit-any
    tailwindCss(tailwindConfig) as any,
    // deno-lint-ignore no-explicit-any
    autoprefixer(options.autoprefixer) as any,
  ];

  if (config.mode === "production") {
    const { default: cssnano } = await import("cssnano");
    plugins.push(cssnano());
  }

  const res = postcss(plugins);
  return res;
}
