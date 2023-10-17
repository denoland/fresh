import type {
  AcceptedPlugin,
} from "https://deno.land/x/postcss@8.4.16/lib/postcss.js";
import postcss from "https://deno.land/x/postcss@8.4.16/mod.js";
import autoprefixer from "https://deno.land/x/postcss_autoprefixer@0.2.8/mod.js";
import type {
  Plugin,
  PluginAsyncRenderContext,
  PluginRenderStyleTag,
} from "../server.ts";
import { ensureDir } from "$std/fs/mod.ts";
import { basename, extname, join } from "$std/path/mod.ts";
import { encode } from "$std/encoding/base64.ts";

export interface PostCssPluginOptions {
  css: string | string[];
  sourceMap?: boolean;
  dest?: string;
  mode?: "render" | "build";
  setup?: (
    content?: string,
  ) => AcceptedPlugin[];
}

export const STYLE_ELEMENT_ID = "__FRSH_POSTCSS";

export async function processPostCss(
  src: string | string[],
  options: PostCssPluginOptions,
  content?: string,
): Promise<PluginRenderStyleTag[]> {
  const postCssPlugins = options.setup
    ? options.setup(content)
    : [autoprefixer()];
  const cssSrc = Array.isArray(src) ? src : [src];
  const dest = options.dest ?? "./static";
  return await Promise.all(
    cssSrc.map(async (src, idx): Promise<PluginRenderStyleTag> => {
      const isFile = src.startsWith("./") || src.startsWith("/") ||
        src.startsWith("file://");
      const fileName = isFile ? basename(src, extname(src)) : `style_${idx}`;
      const opts = isFile
        ? {
          from: isFile ? src : undefined,
          to: join(dest, `${fileName}.css`),
        }
        : undefined;

      const srcContent = isFile ? await Deno.readTextFile(src) : src;
      const result = await postcss(postCssPlugins).process(srcContent, opts);
      const inlineMap = (options.sourceMap && result.map)
        ? `\n/*# sourceMappingURL=data:application/json;base64,${
          encode(result.map.toString())
        }*/`
        : "";

      return {
        cssText: result.css + inlineMap,
        id: `${STYLE_ELEMENT_ID}_${fileName.toLowerCase()}`,
      };
    }),
  );
}

async function getStyles(
  ctx: PluginAsyncRenderContext,
  options: PostCssPluginOptions,
) {
  const res = await ctx.renderAsync();
  const styles = await processPostCss(options.css, options, res.htmlText);
  return {
    styles,
  };
}

/**
 * # Fresh PostCSS Plugin
 * @param options - {@link PostCssPluginOptions} PostCSS plugin options
 * @returns Fresh Plugin to process PostCSS
 * @example
 * ```ts
 * import { defineConfig } from "$fresh/server.ts";
 * import { postcssPlugin } from "$fresh/plugins/postcss.ts";
 *
 * export default defineConfig({
 *  plugins: [
 *      postcssPlugin({
 *          css: "./src/styles.css",
 *          setup: (content) => [autoprefixer(), tailwind({ content })],
 *          mode: "render",
 *          dest: "./static/styles",
 *      })
 *    ],
 *  });
 * ```
 */
export default function postcssPlugin(options: PostCssPluginOptions): Plugin {
  const plugin: Plugin = {
    name: "postcss",
  };

  const mode = options.mode ?? "render";

  if (mode === "render") {
    plugin.renderAsync = async (ctx) => {
      return await getStyles(ctx, options);
    };
  }

  if (mode === "build") {
    plugin.buildStart = async () => {
      if (options.dest) {
        await ensureDir(options.dest);
      }

      const styles = await processPostCss(options.css, options);
      await Promise.all(styles.map(async (style, idx) => {
        await Deno.writeTextFile(
          join(
            options.dest ?? "./static",
            (style.id ?? `style_${idx}`) + ".css",
          ),
          style.cssText,
        );
      }));
    };
  }

  return plugin;
}
