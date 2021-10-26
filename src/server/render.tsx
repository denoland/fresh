/** @jsx h */

import { renderToString } from "./deps.ts";
import { ComponentChildren, h } from "../runtime/deps.ts";
import { DATA_CONTEXT } from "../runtime/hooks.ts";
import { Page, Renderer } from "./types.ts";
import { PageProps } from "../runtime/types.ts";
import { SUSPENSE_CONTEXT } from "../runtime/suspense.ts";
import { HEAD_CONTEXT } from "../runtime/head.ts";
import { REFRESH_JS_URL } from "./constants.ts";

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
  #styles: string[] = [];
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
   * All of the CSS style rules that should be inlined into the document.
   * Adding to this list across multiple renders is supported (even across
   * suspense!). The CSS rules will always be inserted on the client in the
   * order specified here.
   */
  get styles(): string[] {
    return this.#styles;
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

/**
 * This function renders out a page. Rendering is asynchronous, and streaming.
 * Rendering happens in multiple steps, because of the need to handle suspense.
 *
 * 1. The page's vnode tree is constructed.
 * 2. The page's vnode tree is passed to the renderer.
 *   - If the rendering throws a promise, the promise is awaited before
 *     continuing. This allows the renderer to handle async hooks.
 *   - Once the rendering throws no more promises, the initial render is
 *     complete and a body string is returned.
 *   - During rendering, every time a `<Suspense>` is rendered, it, and it's
 *     attached children are recorded for later rendering.
 * 3. Once the inital render is complete, the body string is fitted into the
 *    HTML wrapper template.
 * 4. The full inital render in the template is yielded to be sent to the
 *    client.
 * 5. Now the suspended vnodes are rendered. These are individually rendered
 *    like described in step 2 above. Once each node is done rendering, it
 *    wrapped in some boilderplate HTML, and suffixed with some JS, and then
 *    sent to the client. On the client the HTML will be slotted into the DOM
 *    at the location of the original `<Suspense>` node.
 */
export async function* render(opts: RenderOptions): AsyncIterable<string> {
  const props = { params: opts.params, url: opts.url, route: opts.page.route };

  const dataCache = new Map();
  const suspenseQueue: ComponentChildren[] = [];
  const headComponents: ComponentChildren[] = [];

  const vnode = h(HEAD_CONTEXT.Provider, {
    value: headComponents,
    children: h(DATA_CONTEXT.Provider, {
      value: dataCache,
      children: h(SUSPENSE_CONTEXT.Provider, {
        value: suspenseQueue,
        children: h(opts.page.component!, props),
      }),
    }),
  });

  const ctx = new RenderContext(crypto.randomUUID(), opts.url, opts.page.route);

  let suspended = 0;
  const renderWithRenderer = (): string | Promise<string> => {
    // Clear the suspense queue
    suspenseQueue.splice(0, suspenseQueue.length);
    // Clear the head components
    headComponents.splice(0, headComponents.length);

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

  let templateProps: {
    props: PageProps;
    data?: [string, unknown][];
  } | undefined = { props, data: [...dataCache.entries()] };
  if (templateProps.data!.length === 0) {
    delete templateProps.data;
  }

  // If this is a static render (runtimeJS is false), then we don't need to
  // render the props into the template.
  if (
    opts.imports.length === 0 ||
    (opts.imports.length === 1 && opts.imports[0] === REFRESH_JS_URL)
  ) {
    templateProps = undefined;
  }

  const html = template({
    bodyHtml,
    headComponents,
    imports: opts.imports,
    preloads: opts.preloads,
    styles: ctx.styles,
    props: templateProps,
    lang: ctx.lang,
  });

  let clientStyles = [...ctx.styles];
  yield html;

  if (suspenseQueue.length > 0) {
    // minified client-side JS
    yield '<script>(()=>{window.$SR=t=>{const e=document.getElementById("S:"+t),o=document.getElementById("E:"+t),d=document.getElementById("R:"+t);for(d.parentNode.removeChild(d);e.nextSibling!==o;)e.parentNode.removeChild(e.nextSibling);for(;d.firstChild;)e.parentNode.insertBefore(d.firstChild,o);e.parentNode.removeChild(e),o.parentNode.removeChild(o)};const n=document.getElementById("__FRSH_STYLE"),r=n.childNodes[0]?.textContent.split(`\n`);if(r!==void 0){n.removeChild(n.firstChild);for(const t of r)n.append(document.createTextNode(t))}window.$ST=t=>{for(const[e,o]of t)n.insertBefore(document.createTextNode(e),n.childNodes[o])}})();\n</script>';
  }

  // TODO(lucacasonato): parallelize this
  for (const [id, children] of suspenseQueue.entries()) {
    const fragment = await suspenseRender(opts.renderer, ctx, id + 1, children);

    const cssInserts: [string, number][] = [];
    for (const [i, style] of ctx.styles.entries()) {
      if (!clientStyles.includes(style)) {
        cssInserts.push([style, i]);
      }
    }
    clientStyles = [...ctx.styles];

    if (cssInserts.length > 0) {
      yield `<script>$ST(${JSON.stringify(cssInserts)});</script>`;
    }

    yield fragment;
  }
}

export async function suspenseRender(
  renderer: Renderer,
  ctx: RenderContext,
  id: number,
  children: ComponentChildren,
): Promise<string> {
  const dataCache = new Map();

  const vnode = h(DATA_CONTEXT.Provider, {
    value: dataCache,
    children,
  });

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

    renderer.render(ctx, render);

    if (body !== null) {
      return body;
    } else if (promise !== null) {
      return (promise as Promise<unknown>).then(renderWithRenderer);
    } else {
      throw new Error("`render` function not called by renderer.");
    }
  };

  const html = await renderWithRenderer();

  return `<div hidden id="R:${id}">${html}</div><script>$SR(${id})</script>`;
}

export interface TemplateOptions {
  bodyHtml: string;
  headComponents: ComponentChildren[];
  imports: string[];
  styles: string[];
  preloads: string[];
  props: unknown;
  lang: string;
}

export function template(opts: TemplateOptions): string {
  const page = (
    <html lang={opts.lang}>
      <head>
        <meta charSet="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {opts.preloads.map((src) => <link rel="modulepreload" href={src} />)}
        {opts.imports.map((src) => <script src={src} type="module"></script>)}
        <style
          id="__FRSH_STYLE"
          dangerouslySetInnerHTML={{ __html: opts.styles.join("\n") }}
        />
        {opts.headComponents}
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
