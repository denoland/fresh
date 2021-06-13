import { generateUuid, renderToString } from "./deps.ts";
import { ComponentChild, h } from "../runtime/deps.ts";
import { DATA_CONTEXT } from "../runtime/hooks.ts";
import { Page, Renderer } from "./types.ts";

export interface RenderOptions {
  page: Page;
  imports: string[];
  preloads: string[];
  params: Record<string, string>;
  renderer: Renderer;
}

export type RenderFn = () => void;

export class RenderContext {
  #id: string;
  #state: Map<string, unknown> = new Map();
  #head: ComponentChild[] = [];

  constructor(id: string) {
    this.#id = id;
  }

  /** A unique ID for this logical JIT render. */
  get id(): string {
    return this.#id;
  }

  /**
   * State that is persisted between multiple renders with the same render
   * context. This is useful because one logical JIT render could have multiple
   * preact render passes due to suspense.
   */
  get state(): Map<string, unknown> {
    return this.#state;
  }

  /**
   * Items to add to the <head> for this render.
   */
  get head(): ComponentChild[] {
    return this.#head;
  }
}

const MAX_SUSPENSE_DEPTH = 10;

export async function render(opts: RenderOptions): Promise<string> {
  const props = { params: opts.params };

  const dataCache = new Map();

  const vnode = h(DATA_CONTEXT.Provider, {
    value: dataCache,
    children: h(opts.page.component, props),
  });

  const ctx = new RenderContext(generateUuid());

  let suspended = 0;
  const renderWithRenderer = (): string | Promise<string> => {
    if (++suspended > MAX_SUSPENSE_DEPTH) {
      throw new Error(
        `Reached maximum suspense depth of ${MAX_SUSPENSE_DEPTH}.`,
      );
    }

    let body: string | null = null;
    let promise: Promise<unknown> | null = null;

    function render() {
      try {
        body = renderToString(vnode);
      } catch (e) {
        if (e && e.then) {
          promise = e;
          return;
        }
        throw e;
      }
    }

    opts.renderer.render(ctx, render);

    if (body !== null) {
      return body;
    } else if (promise !== null) {
      return (promise as Promise<unknown>).then(renderWithRenderer);
    } else {
      throw new Error("`render` function not called by renderer.");
    }
  };

  const bodyHtml = await renderWithRenderer();

  opts.renderer.postRender(ctx, bodyHtml);

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

  if (opts.imports.length === 0) {
    templateProps = undefined;
  }

  const html = template({
    bodyHtml,
    imports: opts.imports,
    preloads: opts.preloads,
    head: ctx.head,
    props: templateProps,
  });

  return html;
}

export interface TemplateOptions {
  bodyHtml: string;
  imports: string[];
  head: ComponentChild[];
  preloads: string[];
  props: unknown;
}

export function template(opts: TemplateOptions): string {
  const page = (
    <html>
      <head>
        {opts.preloads.map((src) => <link rel="modulepreload" href={src} />)}
        {opts.imports.map((src) => <script src={src} type="module"></script>)}
        {opts.head}
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
