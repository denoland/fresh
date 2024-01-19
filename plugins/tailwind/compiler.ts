import { ResolvedFreshConfig } from "../../server.ts";
import tailwindCss, { Config } from "tailwindcss";
import postcss from "npm:postcss@8.4.31";
import cssnano from "npm:cssnano@6.0.1";
import autoprefixer from "npm:autoprefixer@10.4.16";
import * as path from "https://deno.land/std@0.207.0/path/mod.ts";
import { TailwindPluginOptions } from "./types.ts";
import {
  createGraph,
  type ModuleGraphJson,
} from "https://deno.land/x/deno_graph@0.63.3/mod.ts";

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

  tailwindConfig.content = tailwindConfig.content.map((pattern) => {
    if (typeof pattern === "string") {
      const relative = path.relative(Deno.cwd(), path.dirname(configPath));

      if (!relative.startsWith("..")) {
        return path.join(relative, pattern);
      }
    }
    return pattern;
  });

  const imports = (readDenoConfig()?.imports ?? []) as Record<string, string>;
  for (const plugin of config.plugins ?? []) {
    if (!plugin.location) continue;
    // if the plugin is declared in a separate place than the project, the plugin developer should have specified a projectLocation
    // otherwise, we assume the plugin is in the same directory as the project
    const projectLocation = plugin.projectLocation ?? plugin.location;
    const moduleGraph = await createGraph(plugin.location, {
      resolve: createCustomResolver(imports),
    });

    for (const file of extractSpecifiers(moduleGraph, projectLocation)) {
      const response = await fetch(file);
      const content = await response.text();
      tailwindConfig.content.push({ raw: content });
    }
  }

  // PostCSS types cause deep recursion
  const plugins = [
    // deno-lint-ignore no-explicit-any
    tailwindCss(tailwindConfig) as any,
    // deno-lint-ignore no-explicit-any
    autoprefixer(options.autoprefixer) as any,
  ];

  if (!config.dev) {
    plugins.push(cssnano());
  }

  return postcss(plugins);
}

const fileTypes = [".tsx"];

function extractSpecifiers(graph: ModuleGraphJson, projectLocation: string) {
  const specifiers: Set<string> = new Set();

  for (const module of graph.modules) {
    if (
      fileTypes.some((type) =>
        module.specifier.endsWith(type) &&
        module.specifier.startsWith(path.dirname(projectLocation))
      )
    ) {
      specifiers.add(module.specifier);
    }
  }
  return Array.from(specifiers);
}

function readDenoConfig() {
  try {
    const configText = Deno.readTextFileSync("./deno.json");
    const config = JSON.parse(configText);
    return config;
  } catch (err) {
    console.error("Error reading deno.json:", err);
    return null;
  }
}

function createCustomResolver(imports: Record<string, string>) {
  return function customResolve(specifier: string, referrer: string): string {
    for (const [key, value] of Object.entries(imports)) {
      if (specifier.startsWith(key)) {
        const mappedPath = specifier.replace(key, value);
        return new URL(mappedPath, referrer).toString();
      }
    }
    return new URL(specifier, referrer).toString();
  };
}
