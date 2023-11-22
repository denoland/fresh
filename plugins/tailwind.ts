import { Plugin, PluginMiddleware, ResolvedFreshConfig } from "../server.ts";
import tailwindCss, { Config } from "tailwindcss";
import postcss from "npm:postcss@8.4.31";
import cssnano from "npm:cssnano@6.0.1";
import * as path from "https://deno.land/std@0.207.0/path/mod.ts";
import { walk } from "https://deno.land/std@0.207.0/fs/walk.ts";

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

async function initTailwind(
  config: ResolvedFreshConfig,
): Promise<postcss.Processor> {
  const root = path.dirname(config.staticDir);

  const configPath = await findTailwindConfigFile(root);
  console.log({ configPath, cwd: Deno.cwd() });
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

  // PostCSS types cause deep recursion
  // deno-lint-ignore no-explicit-any
  const plugins: any[] = [
    tailwindCss(tailwindConfig),
  ];

  if (!config.dev) {
    plugins.push(cssnano());
  }

  return postcss(plugins);
}

export default function tailwind(): Plugin {
  let staticDir = path.join(Deno.cwd(), "static");
  let processor: postcss.Processor | null = null;

  const cache = new Map<string, { content: string; map: string }>();

  const tailwindMiddleware: PluginMiddleware = {
    path: "/",
    middleware: {
      handler: async (req, ctx) => {
        const pathname = new URL(req.url).pathname;

        if (req.url.endsWith(".css.map")) {
          const cached = cache.get(pathname);
          if (cached) return Response.json(cached.map);
        }

        if (!req.url.endsWith(".css") || !processor) {
          return ctx.next();
        }

        let cached = cache.get(pathname);
        if (!cached) {
          const filePath = path.join(staticDir, pathname);
          let text = "";
          try {
            text = await Deno.readTextFile(filePath);
            const res = await processor.process(text, {
              from: undefined,
            });

            cached = {
              content: res.content,
              map: res.map?.toString() ?? "",
            };
            cache.set(pathname, cached);
          } catch (err) {
            cached = {
              content: text,
              map: "",
            };
            console.error(err);
          }
        }

        return new Response(cached!.content, {
          status: 200,
          headers: {
            "Content-Type": "text/css",
            "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
          },
        });
      },
    },
  };

  const middlewares: Plugin["middlewares"] = [];

  return {
    name: "tailwind",
    async configResolved(config) {
      if (config.dev) {
        staticDir = config.staticDir;
        processor = await initTailwind(config);
        middlewares.push(tailwindMiddleware);
      }
    },
    middlewares,
    async buildStart(config) {
      staticDir = config.staticDir;
      const outDir = path.join(config.build.outDir, "static");
      processor = await initTailwind(config);

      const files = walk(config.staticDir, {
        exts: ["css"],
        includeDirs: false,
        includeFiles: true,
      });

      for await (const file of files) {
        const content = await Deno.readTextFile(file.path);
        const result = await processor.process(content, {
          from: undefined,
        });

        const relFilePath = path.relative(staticDir, file.path);
        const outPath = path.join(outDir, relFilePath);
        await Deno.writeTextFile(outPath, result.content);
      }
    },
  };
}
