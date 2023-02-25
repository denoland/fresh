import {
  setup,
  Sheet,
  TwindConfig,
  SheetRule,
  cssom,
  stringify,
} from "https://esm.sh/@twind/core@1.1.3";
import { STYLE_ELEMENT_ID } from "./shared.ts";

// https://github.com/denoland/fresh/pull/946#issuecomment-1416191106
export default function hydrate(options: TwindConfig) {
  const styleElement = document.getElementById(
    STYLE_ELEMENT_ID
  ) as HTMLStyleElement;
  const sheet = cssom(styleElement);
  sheet.resume = resume.bind(sheet);

  setup(options, sheet);
}

// https://github.com/tw-in-js/twind/blob/main/packages/core/src/sheets.ts#L206
function resume(
  this: Sheet,
  addClassName: (className: string) => void,
  insert: (cssText: string, rule: SheetRule) => void
) {
  // hydration from SSR sheet
  const textContent = stringify(this.target);
  const RE = /\/\*!([\da-z]+),([\da-z]+)(?:,(.+?))?\*\//g;

  // only if this is a hydratable sheet
  if (RE.test(textContent)) {
    // RE has global flag — reset index to get the first match as well
    RE.lastIndex = 0;

    // 1. start with a fresh sheet
    this.clear();

    // 2. add all existing class attributes to the token/className cache
    if (typeof document != "undefined") {
      // deno-lint-ignore no-explicit-any
      for (const el of document.querySelectorAll("[class]") as any) {
        addClassName(el.getAttribute("class") as string);
      }
    }

    // 3. parse SSR styles
    let lastMatch: RegExpExecArray | null | undefined;

    while (
      (function commit(match?: RegExpExecArray | null) {
        if (lastMatch) {
          // const tc = textContent.slice(
          //   lastMatch.index + lastMatch[0].length,
          //   match?.index
          // );
          // console.log(tc);

          insert(
            // grep the cssText from the previous match end up to this match start
            textContent.slice(
              lastMatch.index + lastMatch[0].length,
              match?.index
            ),
            {
              p: parseInt(lastMatch[1], 36),
              o: parseInt(lastMatch[2], 36) / 2,
              n: lastMatch[3],
            }
          );
        }

        return (lastMatch = match);
      })(RE.exec(textContent))
    ) {
      /* no-op */
    }
  }
}
