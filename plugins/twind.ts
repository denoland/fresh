import { virtualSheet } from "twind/sheets";
import { Plugin } from "../server.ts";

import { Options, setup, STYLE_ELEMENT_ID } from "./twind/shared.ts";
export type { Options };

export default function twind(options: Options): Plugin {
  const sheet = virtualSheet();
  setup(options, sheet);
  const main = `data:application/javascript,import hydrate from "${
    new URL("./twind/main.ts", import.meta.url).href
  }";
import options from "${options.selfURL}";
export default function(state) { hydrate(options, state); }`;
  return {
    name: "twind",
    entrypoints: { "main": main },
    async renderAsync(ctx) {
      sheet.reset(undefined);
      await ctx.renderAsync();
      const cssTexts = [...sheet.target];
      const snapshot = sheet.reset();
      const precedences = snapshot[1] as number[];

      const cssText = cssTexts.map((cssText, i) =>
        `${cssText}/*${precedences[i].toString(36)}*/`
      ).join("\n");

      const mappings: (string | [string, string])[] = [];
      for (
        const [key, value] of (snapshot[3] as Map<string, string>).entries()
      ) {
        if (key === value) {
          mappings.push(key);
        } else {
          mappings.push([key, value]);
        }
      }

      return {
        scripts: [{ entrypoint: "main", state: mappings }],
        styles: [{ cssText, id: STYLE_ELEMENT_ID }],
      };
    },
  };
}
