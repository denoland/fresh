import { renderToString } from "./deps.ts";
import * as rt from "../runtime/deps.ts";
import { Page } from "./routes.ts";

export function render(
  page: Page,
  imports: string[],
  preloads: string[],
  params: Record<string, string>,
): string {
  const props = { params };
  const propsStr = JSON.stringify(props);
  const body = renderToString(rt.h(page.component, props));
  return `<!DOCTYPE html>
<html>
  <head>
    ${
    preloads.map((src) => `<link rel="modulepreload" href="${src}">`).join(
      "\n    ",
    )
  }
    ${
    imports.map((src) => `<script src="${src}" type="module"></script>`).join(
      "\n    ",
    )
  }
  </head>
  <body>
    ${body}
    <script id="__FRSH_PROPS" type="application/json">${propsStr}</script>
  </body>
</html>`;
}
