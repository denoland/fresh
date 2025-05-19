import type { Config as _TailwindConfig } from "tailwindcss";

export interface TailwindPluginOptions {
  /**
   * https://tailwindcss.com/docs/installation/using-postcss
   */
  postcssOptions?: Record<string, unknown>;

  /**
   * if true, minify the CSS in production mode
   */
  minify?: boolean;

  /**
   * use cssnano options
   */
  // deno-lint-ignore no-explicit-any
  cssnanoOptions?: Record<string, any>;
