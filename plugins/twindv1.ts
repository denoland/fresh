import { BaseTheme, stringify, virtual } from "./twindv1_deps.ts";
import { Options, setup, STYLE_ELEMENT_ID } from "./twindv1/shared.ts";
import { Plugin } from "../src/server/types.ts";
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
      await ctx.renderAsync();
      const cssText = stringify(sheet.target);
      return {
        scripts: [{ entrypoint: "main", state: [] }],
        styles: [{ cssText, id: STYLE_ELEMENT_ID }],
      };
    },
  };
}
