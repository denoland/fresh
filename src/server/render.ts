import { renderToString } from "./deps.ts";
import * as rt from "../runtime/deps.ts";
import { Page } from "./page.ts";
import { BUILD_ID, INTERNAL_PREFIX, JS_PREFIX } from "./constants.ts";

export function render(page: Page, params: Record<string, string>): string {
  const props = { params };
  const body = renderToString(rt.h(page.component, props));
  return `<!DOCTYPE html><html><head><script src="${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}/${page.name}.js" type="module"></script></head><body>${body}<script id="__FRSH_PROPS" type="application/json">${
    JSON.stringify(props)
  }</script></body></html>`;
}
