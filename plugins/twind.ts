import { virtualSheet } from "twind/sheets";
import { Plugin } from "../server.ts";

import { Options, setup, STYLE_ELEMENT_ID } from "./twind/shared.ts";
export type { Options };

export default function twind(options: Options): Plugin {
  const sheet = virtualSheet();
  setup(options, sheet);
  return {
    name: "twind",
    entrypoints: { "main": new URL("./twind/main.ts", import.meta.url).href },
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
        const state = [options, precedences, mappings];
        scripts.push({ entrypoint: "main", state });
      }
      return {
        scripts,
        styles: [{ cssText, id: STYLE_ELEMENT_ID }],
      };
    },
  };
}
