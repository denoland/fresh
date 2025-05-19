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
   * Whether to minify the CSS in production mode
   * @default true
   */
  minify?: boolean;
}
