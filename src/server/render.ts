import { renderToString } from "./deps.ts";
import * as rt from "../runtime/deps.ts";
import { Page } from "./types.ts";

export interface RenderOptions {
  page: Page;
  imports: string[];
  preloads: string[];
  params: Record<string, string>;
}

export function render(options: RenderOptions): string {
  const props = { params: options.params };
  const propsStr = JSON.stringify(props);
  const body = renderToString(rt.h(options.page.component, props));
  return `<!DOCTYPE html>
<html>
  <head>
    ${
    options.preloads.map((src) => `<link rel="modulepreload" href="${src}">`)
      .join(
        "\n    ",
      )
  }
    ${
    options.imports.map((src) => `<script src="${src}" type="module"></script>`)
      .join(
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
