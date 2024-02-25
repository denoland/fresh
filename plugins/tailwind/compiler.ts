import { ResolvedFreshConfig } from "../../server.ts";
import tailwindCss, { Config } from "tailwindcss";
import postcss from "npm:postcss@8.4.35";
import cssnano from "npm:cssnano@6.0.3";
import autoprefixer from "npm:autoprefixer@10.4.17";
import * as path from "https://deno.land/std@0.216.0/path/mod.ts";
import { TailwindPluginOptions } from "./types.ts";
import {
  createGraph,
  type ModuleGraphJson,
} from "https://deno.land/x/deno_graph@0.63.5/mod.ts";
import { parseFromJson } from "https://deno.land/x/import_map@v0.18.3/mod.ts";
import { parse as jsoncParse } from "https://deno.land/std@0.213.0/jsonc/mod.ts";

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

  let importMap;
  if (path.extname(config.denoJsonPath) === ".json") {
    importMap = (await import(path.toFileUrl(config.denoJsonPath).href, {
      with: { type: "json" },
    })).default;
  } else if (path.extname(config.denoJsonPath) === ".jsonc") {
    const fileContents = Deno.readTextFileSync(config.denoJsonPath);
    importMap = jsoncParse(fileContents);
  } else {
    throw Error("deno config must be either .json or .jsonc");
  }
  for (const plugin of config.plugins ?? []) {
    if (plugin.location === undefined) continue;
    // if the plugin is declared in a separate place than the project, the plugin developer should have specified a projectLocation
    // otherwise, we assume the plugin is in the same directory as the project
    const projectLocation = plugin.projectLocation ??
      path.dirname(plugin.location);
    const resolvedImportMap = await parseFromJson(
      path.toFileUrl(config.denoJsonPath),
      importMap,
    );

    const moduleGraph = await createGraph(plugin.location, {
      resolve: resolvedImportMap.resolve.bind(resolvedImportMap),
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

function extractSpecifiers(graph: ModuleGraphJson, projectLocation: string) {
  return graph.modules
    .filter((module) =>
      (module.specifier.endsWith(".tsx") ||
        module.specifier.endsWith(".jsx")) &&
      module.specifier.startsWith(projectLocation)
    )
    .map((module) => module.specifier);
}
