import type { OnTransformOptions } from "fresh/dev";

// based on the original code, this type is used to define options for the Tailwind plugin
type PluginOptions = {
  /**
   * Base CSS to be included. Set to null to exclude base styles.
   */
  base?: string;
  /**
   * Enable or disable CSS optimization. Defaults to true if Fresh is in production mode and false otherwise.
   * Can be a boolean or an object with minify options.
   * @default app.config.mode === "production"
   */
  optimize?: boolean | {
    minify?: boolean;
  };
};

export interface TailwindPluginOptions extends PluginOptions {
  /** Exclude paths or globs that should not be processed */
  exclude?: OnTransformOptions["exclude"];
}
