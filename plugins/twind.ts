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
    render(ctx) {
      sheet.reset(undefined);
      const res = ctx.render();
      const cssText = [...sheet.target].join("\n");
      const snapshot = sheet.reset();
      const scripts = [];
      if (res.requiresHydration) {
        const precedences = snapshot[1];
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
        const state = [precedences, mappings];
        scripts.push({ entrypoint: "main", state });
      }
      return {
        scripts,
        styles: [{ cssText, id: STYLE_ELEMENT_ID }],
      };
    },
  };
}
