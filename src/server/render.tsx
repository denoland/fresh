import { renderToString } from "./deps.ts";
import { h } from "../runtime/deps.ts";
import { DATA_CONTEXT } from "../runtime/hooks.ts";
import { Page } from "./types.ts";

export interface RenderOptions {
  page: Page;
  imports: string[];
  preloads: string[];
  params: Record<string, string>;
}

const MAX_SUSPENSE_DEPTH = 10;

export async function render(opts: RenderOptions): Promise<string> {
  const props = { params: opts.params };

  const dataCache = new Map();

  const vnode = h(DATA_CONTEXT.Provider, {
    value: dataCache,
    children: h(opts.page.component, props),
  });

  let suspended = 0;
  const render = (): string | Promise<string> => {
    if (++suspended > MAX_SUSPENSE_DEPTH) {
      throw new Error(
        `Reached maximum suspense depth of ${MAX_SUSPENSE_DEPTH}.`,
      );
    }
    try {
      return renderToString(vnode);
    } catch (e) {
      if (e && e.then) return e.then(render);
      throw e;
    }
  };

  const bodyHtml = await render();

  let templateProps: {
    params?: Record<string, string>;
    data?: [string, unknown][];
  } | undefined = { params: opts.params, data: [...dataCache.entries()] };
  if (Object.entries(templateProps.params!).length === 0) {
    delete templateProps.params;
  }
  if (templateProps.data!.length === 0) {
    delete templateProps.data;
  }
  if (Object.entries(templateProps).length === 0) {
    templateProps = undefined;
  }

  const html = template({
    bodyHtml,
    imports: opts.imports,
    preloads: opts.preloads,
    props: templateProps,
  });

  return html;
}

export interface TemplateOptions {
  bodyHtml: string;
  imports: string[];
  preloads: string[];
  props: unknown;
}

export function template(opts: TemplateOptions): string {
  const page = (
    <html>
      <head>
        {opts.preloads.map((src) => <link rel="modulepreload" href={src} />)}
        {opts.imports.map((src) => <script src={src} type="module"></script>)}
      </head>
      <body>
        <div dangerouslySetInnerHTML={{ __html: opts.bodyHtml }} id="__FRSH" />
        {opts.props !== undefined
          ? <script
            id="__FRSH_PROPS"
            type="application/json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(opts.props) }}
          />
          : null}
      </body>
    </html>
  );

  return "<!DOCTYPE html>" + renderToString(page);
}
