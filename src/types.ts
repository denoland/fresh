export interface LayoutConfig {
  /**
   * Skip already inherited layouts
   * Default: `false`
   */
  skipInheritedLayouts?: boolean;

  /**
   * Skip rendering the `routes/_app` template
   * Default: `false`
   */
  skipAppWrapper?: boolean;
}

// TODO: Uncomment once JSR supports global types
// declare global {
//   namespace preact.createElement.JSX {
//     interface HTMLAttributes {
//       /**
//        * Alternative url to fetch partials from on `<a>` or `<form>` tags
//        */
//       "f-partial"?: string | SignalLike<string>;
//       /**
//        * Enable or disable client side navigation and partials for this
//        * particular node and its children.
//        */
//       "f-client-nav"?: boolean | SignalLike<boolean>;
//     }
//   }
// }
