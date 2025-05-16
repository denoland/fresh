import { Plugin } from "$fresh/server.ts";
import { Config } from "windicss";
import {
  generateWindicss,
  getClassesFromHtml,
  STYLE_ELEMENT_ID,
} from "./windi/shared.ts";

/**
 * @see https://windicss.org/integrations/javascript.html
 *
 * Windi plugin for deno fresh.
 * Takes windicss or tailwind {@link config} as an argument
 * and generates css inside STYLE_ELEMENT_ID via fresh render function context.
 *
 * This file contains common SSR styles generation for static html routes.
 * `windi/main.ts` contains client logic for islands.
 * `windi/shared.ts` contains API functions
 *
 * @function windi
 *
 * @param config {@link Config}
 * @return {@link Plugin}
 */
export default function windi(config: Config): Plugin {
  // Not able to pass windi config's plugins functions without this
  // All functions will be erased because of json parse
  const main = `
    data:application/javascript,
    import hydrate from "${new URL("./windi/main.ts", import.meta.url).href}";
    import config from "${config.selfURL}";
    export default function(state) { hydrate(config, state); }
  `;

  return {
    name: "windi",
    entrypoints: { "main": main },
    render(ctx) {
      let scripts = [];
      // Render html
      const res = ctx.render();
      const html = res.htmlText;
      // Parse HTML get classes
      const classes = getClassesFromHtml(html);
      // Generate windicss
      const windicss = generateWindicss(config, classes, html);

      // Load script to handle dynamic styles in islands on the client side
      if (res.requiresHydration) {
        // Pass already generated classes
        scripts.push({ entrypoint: "main", state: classes });
      }

      return {
        scripts,
        styles: [{ cssText: windicss, id: STYLE_ELEMENT_ID }],
      };
    },
  };
}
