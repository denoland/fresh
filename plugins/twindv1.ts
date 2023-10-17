import { stringify, virtual } from "$fresh/plugins/twindv1_deps.ts";
import { Plugin } from "$fresh/server.ts";

import {
  Options,
  setup,
  STYLE_ELEMENT_ID,
} from "$fresh/plugins/twindv1/shared.ts";

import { BaseTheme } from "$fresh/plugins/twindv1_deps.ts";
export type { Options };

export default function twindv1<Theme extends BaseTheme = BaseTheme>(
  options: Options<Theme>,
): Plugin {
  const sheet = virtual(true);
  setup(options, sheet);
  const main = `data:application/javascript,import hydrate from "${
    new URL("./twindv1/main.ts", import.meta.url).href
  }";
import options from "${options.selfURL}";
export default function(state) { hydrate(options, state); }`;
  return {
    name: "twind",
    entrypoints: { "main": main },
    async renderAsync(ctx) {
      const res = await ctx.renderAsync();
      const cssText = stringify(sheet.target);
      const scripts = [];
      if (res.requiresHydration) {
        scripts.push({ entrypoint: "main", state: [] });
      }
      return {
        scripts,
        styles: [{ cssText, id: STYLE_ELEMENT_ID }],
      };
    },
  };
}
