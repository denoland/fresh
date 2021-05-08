import { renderToString } from "./deps.ts";
import * as rt from "../runtime/deps.ts";
import { Page } from "./routes.ts";

export function render(page: Page, params: Record<string, string>): string {
  const props = { params };
  const body = renderToString(rt.h(page.component, props));
  return `<!DOCTYPE html><html><head><script src="/_frsh/s/p/${page.name}.module.js" type="module"></script></head><body>${body}<script id="__FRSH_PROPS" type="application/json">${
    JSON.stringify(props)
  }</script></body></html>`;
}
