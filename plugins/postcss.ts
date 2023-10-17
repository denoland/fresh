import {
  type AcceptedPlugin,
  autoprefixer,
  basename,
  encode,
  ensureDir,
  extname,
  join,
  postcss,
} from "./postcss_deps.ts";
import type { Plugin, PluginRenderStyleTag } from "../server.ts";

export interface PostCssPluginOptions {
  css: string | string[] | Record<string, string>;
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
          from: src,
          to: join(dest, `${fileName}.css`),
        }
        : undefined;

      const srcContent = isFile ? await Deno.readTextFile(src) : src;
      const result = await postcss(postCssPlugins).process(srcContent, opts);
      const inlineMap = (options.sourceMap && result.map)
        ? `\n/*# sourceMappingURL=data:application/json;base64,${
          encode(JSON.stringify(result.map.toJSON()))
        }*/`
        : "";

      return {
        cssText: result.css + inlineMap,
        id: `${STYLE_ELEMENT_ID}_${fileName}`,
      };
    }),
  );
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

  const getStyles = async (content?: string) =>
    (typeof options.css === "string" || Array.isArray(options.css))
      ? await processPostCss(options.css, options, content)
      : await Promise.all(
        Object.entries(options.css).map(async ([key, value]) => {
          return {
            id: `${STYLE_ELEMENT_ID}_${key}`,
            cssText: (await processPostCss(value, options, content)).map((
              style,
            ) => style.cssText).join("\n"),
          };
        }),
      );

  if (mode === "render") {
    plugin.renderAsync = async (ctx) => {
      const res = await ctx.renderAsync();

      return {
        styles: await getStyles(res.htmlText),
      };
    };
  }

  if (mode === "build") {
    plugin.buildStart = async () => {
      if (options.dest) {
        await ensureDir(options.dest);
      }

      const styles = await getStyles();

      await Promise.all(styles.map(async (style, idx) => {
        const fileName = style.id ?? `style_${idx}`;
        await Deno.writeTextFile(
          join(
            options.dest ?? "./static",
            (fileName.replace(`${STYLE_ELEMENT_ID}_`, "")) +
              ".css",
          ),
          style.cssText,
        );
      }));
    };
  }

  return plugin;
}
