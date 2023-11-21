import { Plugin, PluginMiddleware, ResolvedFreshConfig } from "../server.ts";
import tailwindCss, { Config } from "tailwindcss";
import postcss from "npm:postcss@8.4.31";
import * as path from "https://deno.land/std@0.207.0/path/mod.ts";
import { walk } from "https://deno.land/std@0.207.0/fs/walk.ts";

async function initTailwind(
  config: ResolvedFreshConfig,
): Promise<postcss.Processor> {
  const root = path.dirname(config.staticDir);
  let relativeRoot = "";
  if (root !== Deno.cwd()) {
    relativeRoot = path.relative(Deno.cwd(), root).split(path.sep).join("/") +
      "/";
  }

  let tailwindConfig: Config = {
    content: [
      `${relativeRoot}routes/**/*.{ts,tsx,js,jsx,mjs,cjs}`,
      `${relativeRoot}components/**/*.{ts,tsx,js,jsx,mjs,cjs}`,
    ],
  };

  const configFilePaths = [
    path.join(Deno.cwd(), "tailwind.config.ts"),
    path.join(Deno.cwd(), "tailwind.config.js"),
    path.join(Deno.cwd(), "tailwind.config.mjs"),
    path.join(root, "tailwind.config.ts"),
    path.join(root, "tailwind.config.js"),
    path.join(root, "tailwind.config.mjs"),
  ];
  for (const configFile of configFilePaths) {
    let importedConfig: Config | null = null;
    try {
      const url = path.toFileUrl(configFile).href;
      importedConfig = (await import(url)).default as Config;
    } catch (_err) {
      // ignore
    }

    if (importedConfig === null) continue;
    importedConfig.content = importedConfig.content ?? [];

    if (!Array.isArray(importedConfig.content)) {
      throw new Error(`Expected tailwind "content" option to be an array`);
    }

    const configContent = importedConfig.content.map((pattern) => {
      if (typeof pattern === "string") {
        return path.join(
          path.relative(Deno.cwd(), path.dirname(configFile)),
          pattern,
        );
      }
      return pattern;
    });

    tailwindConfig = {
      ...importedConfig,
      content: [
        ...configContent,
        ...tailwindConfig.content as string[],
      ],
    };
    break;
  }

  return postcss([tailwindCss(tailwindConfig)]);
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
