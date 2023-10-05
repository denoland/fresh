import { Signal } from "@preact/signals";

declare global {
  namespace preact.createElement.JSX {
    interface HTMLAttributes {
      /**
       * Alternative url to fetch partials from on `<a>` or `<form>` tags
       */
      "f-partial"?: string | Signal<string>;
      /**
       * Enable or disable client side navigation and partials for this
       * particular node and its children.
       */
      "f-client-nav"?: boolean | Signal<boolean>;
      /**
       * Pass a signal to track loading state of a partial navigation
       */
      "f-loading"?: Signal<boolean>;
    }
  }
}
