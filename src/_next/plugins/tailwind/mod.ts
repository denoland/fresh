import * as path from "jsr:@std/path";
import { walk } from "jsr:@std/fs/walk";
import { TailwindPluginOptions } from "./types.ts";
import { App } from "../../app.ts";
import { initTailwind } from "./compiler.ts";

export async function tailwind<T>(
  app: App<T>,
  options: TailwindPluginOptions = {},
): Promise<void> {
  const processor = await initTailwind(app.config, options);

  const cache = new Map<string, { content: string; map: string }>();

  if (app.config.mode === "dev") {
    app.use(async (ctx) => {
      const pathname = ctx.url.pathname;

      if (pathname.endsWith(".css.map")) {
        const cached = cache.get(pathname);
        if (cached) return Response.json(cached.map);
      }

      if (!pathname.endsWith(".css") || !processor) {
        return ctx.next();
      }

      let cached = cache.get(pathname);
      if (!cached) {
        const filePath = path.join(
          app.config.staticDir,
          pathname.replace(ctx.config.basePath, ""),
        );
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
          // If the file is not found than it's likely a virtual file
          // by the user that they respond to via a middleware.
          if (err instanceof Deno.errors.NotFound) {
            return ctx.next();
          }

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
    });
  } else if (app.config.mode === "build") {
    const outDir = path.join(app.config.build.outDir, "static");

    const files = walk(app.config.staticDir, {
      exts: ["css"],
      includeDirs: false,
      includeFiles: true,
    });

    for await (const file of files) {
      const content = await Deno.readTextFile(file.path);
      const result = await processor.process(content, {
        from: undefined,
      });

      const relFilePath = path.relative(app.config.staticDir, file.path);
      const outPath = path.join(outDir, relFilePath);

      try {
        await Deno.mkdir(path.dirname(outPath), { recursive: true });
      } catch (err) {
        if (!(err instanceof Deno.errors.AlreadyExists)) {
          throw err;
        }
      }

      await Deno.writeTextFile(outPath, result.content);
    }
  } else if (app.config.mode === "prod") {
    throw new Error(`Tailwind plugin should not be used in production.`);
  }
}
