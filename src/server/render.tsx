import { renderToString } from "./deps.ts";
import { ComponentChild, h } from "../runtime/deps.ts";
import { DATA_CONTEXT } from "../runtime/hooks.ts";
import { Page, Renderer } from "./types.ts";
import { PageProps } from "../runtime/types.ts";

export interface RenderOptions {
  page: Page;
  imports: string[];
  preloads: string[];
  url: URL;
  params: Record<string, string | string[]>;
  renderer: Renderer;
}

export type RenderFn = () => void;

export class RenderContext {
  #id: string;
  #state: Map<string, unknown> = new Map();
  #head: ComponentChild[] = [];
  #url: URL;
  #route: string;
  #lang = "en";

  constructor(id: string, url: URL, route: string) {
    this.#id = id;
    this.#url = url;
    this.#route = route;
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

  /** The URL of the page being rendered. */
  get url(): URL {
    return this.#url;
  }

  /** The route matcher (e.g. /blog/:id) that the request matched for this page
   * to be rendered. */
  get route(): string {
    return this.#route;
  }

  /** The language of the page being rendered. Defaults to "en". */
  get lang(): string {
    return this.#lang;
  }
  set lang(lang: string) {
    this.#lang = lang;
  }
}

const MAX_SUSPENSE_DEPTH = 10;

export async function render(opts: RenderOptions): Promise<string> {
  const props = { params: opts.params, url: opts.url, route: opts.page.route };

  const dataCache = new Map();

  const vnode = h(DATA_CONTEXT.Provider, {
    value: dataCache,
    children: h(opts.page.component, props),
  });

  const ctx = new RenderContext(crypto.randomUUID(), opts.url, opts.page.route);

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
    props: PageProps;
    data?: [string, unknown][];
  } | undefined = { props, data: [...dataCache.entries()] };
  if (templateProps.data!.length === 0) {
    delete templateProps.data;
  }

  // If this is a static render (runtimeJS is false), then we don't need to
  // render the props into the template.
  if (opts.imports.length === 0) {
    templateProps = undefined;
  }

  const html = template({
    bodyHtml,
    imports: opts.imports,
    preloads: opts.preloads,
    head: ctx.head,
    props: templateProps,
    lang: ctx.lang,
  });

  return html;
}

export interface TemplateOptions {
  bodyHtml: string;
  imports: string[];
  head: ComponentChild[];
  preloads: string[];
  props: unknown;
  lang: string;
}

export function template(opts: TemplateOptions): string {
  const page = (
    <html lang={opts.lang}>
      <head>
        {opts.preloads.map((src) => <link rel="modulepreload" href={src} />)}
        {opts.imports.map((src) => <script src={src} type="module"></script>)}
        {opts.head}
      </head>
      <body>
        <div dangerouslySetInnerHTML={{ __html: opts.bodyHtml }} id="__FRSH" />
        {opts.props !== undefined
          ? (
            <script
              id="__FRSH_PROPS"
              type="application/json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(opts.props) }}
            />
          )
          : null}
      </body>
    </html>
  );

  return "<!DOCTYPE html>" + renderToString(page);
}
