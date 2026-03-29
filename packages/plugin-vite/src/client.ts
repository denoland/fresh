/**
 * Used internally by the `@fresh/plugin-vite` to add HMR support
 * for Fresh running in the browser.
 *
 * **Do not** import this module directly.
 *
 * @module
 * @private
 */

import type { UpdatePayload } from "vite";
import { hashCode } from "./shared.ts";

if (import.meta.hot) {
  import.meta.hot.on("fresh:reload", () => {
    window.location.reload();
  });

  import.meta.hot.on("vite:beforeUpdate", (module: UpdatePayload) => {
    module.updates.forEach((update) => {
      const moduleStyle = document.querySelector(
        `[vite-module-id="${hashCode(update.acceptedPath)}"]`,
      );
      if (moduleStyle) {
        moduleStyle.remove();
      }
    });
  });
}
