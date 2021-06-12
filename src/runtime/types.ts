export interface PageProps {
  params: Record<string, string | string[]>;
}

export interface PageConfig {
  /**
   * Setting this flag to `false` disables all client side runtime JS. This
   * means that all interactivity on the client that depends on Preact or other
   * JS code will not function. This option is set to `true` (runtime javascript
   * is enabled) by default.
   *
   * It is recommended to disable runtime JavaScript for static pages that do
   * not require interactivity, like marketing or blog pages.
   */
  runtimeJS?: boolean;
}
