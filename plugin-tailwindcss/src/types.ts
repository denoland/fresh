import type { OnTransformOptions } from "@fresh/core/dev";

export interface TailwindPluginOptions {
  /** Exclude paths or globs that should not be processed */
  exclude?: OnTransformOptions["exclude"];
}
