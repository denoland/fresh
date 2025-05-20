import type { Config } from "tailwindcss";

export interface TailwindPluginOptions {
  /**
   * Tailwind CSS configuration
   */
  config?: Config;

  /**
   * PostCSS options
   */
  postcssOptions?: Record<string, unknown>;

  /**
   * Whether to minify the CSS. If Fresh is in production mode (`config.mode === "production"`) and this undefined, this is automatically set to `true`.
   *
   * @default {true}
   */
  minify?: boolean;
}
