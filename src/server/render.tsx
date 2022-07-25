/** @jsx h */
import { renderToString } from "preact-render-to-string";
import { ComponentChildren, ComponentType, h, options } from "preact";
import {
  AppModule,
  ErrorPage,
  Island,
  RenderFunction,
  Route,
  UnknownPage,
} from "./types.ts";
import { HEAD_CONTEXT } from "../runtime/head.ts";
import { CSP_CONTEXT, nonce, NONE, UNSAFE_INLINE } from "../runtime/csp.ts";
import { ContentSecurityPolicy } from "../runtime/csp.ts";
import { bundleAssetUrl } from "./constants.ts";
import { assetHashingHook } from "../runtime/utils.ts";

export interface RenderOptions<Data> {
  route: Route<Data> | UnknownPage | ErrorPage;
  islands: Island[];
  app: AppModule;
  imports: string[];
  preloads: string[];
  url: URL;
  params: Record<string, string | string[]>;
  renderFn: RenderFunction;
  data?: Data;
  error?: unknown;
  lang?: string;
}

export type InnerRenderFunction = () => string;

export class RenderContext {
  #id: string;
  #state: Map<string, unknown> = new Map();
  #styles: string[] = [];
  #url: URL;
  #route: string;
  #lang: string;

  constructor(id: string, url: URL, route: string, lang: string) {
    this.#id = id;
    this.#url = url;
    this.#route = route;
    this.#lang = lang;
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

function defaultCsp() {
  return {
    directives: { defaultSrc: [NONE], styleSrc: [UNSAFE_INLINE] },
    reportOnly: false,
  };
}

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
export async function render<Data>(
  opts: RenderOptions<Data>,
): Promise<[string, ContentSecurityPolicy | undefined]> {
  const props: Record<string, unknown> = {
    params: opts.params,
    url: opts.url,
    route: opts.route.pattern,
    data: opts.data,
  };
  if (opts.error) {
    props.error = opts.error;
  }

  const csp: ContentSecurityPolicy | undefined = opts.route.csp
    ? defaultCsp()
    : undefined;
  const headComponents: ComponentChildren[] = [];

  const vnode = h(CSP_CONTEXT.Provider, {
    value: csp,
    children: h(HEAD_CONTEXT.Provider, {
      value: headComponents,
      children: h(opts.app.default, {
        Component() {
          return h(opts.route.component! as ComponentType<unknown>, props);
        },
      }),
    }),
  });

  const ctx = new RenderContext(
    crypto.randomUUID(),
    opts.url,
    opts.route.pattern,
    opts.lang ?? "en",
  );

  if (csp) {
    // Clear the csp
    const newCsp = defaultCsp();
    csp.directives = newCsp.directives;
    csp.reportOnly = newCsp.reportOnly;
  }
  // Clear the head components
  headComponents.splice(0, headComponents.length);

  // Setup the interesting VNode types
  ISLANDS.splice(0, ISLANDS.length, ...opts.islands);

  // Clear the encountered vnodes
  ENCOUNTERED_ISLANDS.clear();

  // Clear the island props
  ISLAND_PROPS = [];

  let bodyHtml: string | null = null;

  function render() {
    bodyHtml = renderToString(vnode);
    return bodyHtml;
  }

  await opts.renderFn(ctx, render as InnerRenderFunction);

  if (bodyHtml === null) {
    throw new Error("The `render` function was not called by the renderer.");
  }

  const imports = opts.imports.map((url) => {
    const randomNonce = crypto.randomUUID().replace(/-/g, "");
    if (csp) {
      csp.directives.scriptSrc = [
        ...csp.directives.scriptSrc ?? [],
        nonce(randomNonce),
      ];
    }
    return [url, randomNonce] as const;
  });

  if (ENCOUNTERED_ISLANDS.size > 0) {
    // Load the main.js script
    {
      const randomNonce = crypto.randomUUID().replace(/-/g, "");
      if (csp) {
        csp.directives.scriptSrc = [
          ...csp.directives.scriptSrc ?? [],
          nonce(randomNonce),
        ];
      }
      const url = bundleAssetUrl("/main.js");
      imports.push([url, randomNonce] as const);
    }

    // Prepare the inline script that loads and revives the islands
    let islandImports = "";
    let islandRegistry = "";
    for (const island of ENCOUNTERED_ISLANDS) {
      const randomNonce = crypto.randomUUID().replace(/-/g, "");
      if (csp) {
        csp.directives.scriptSrc = [
          ...csp.directives.scriptSrc ?? [],
          nonce(randomNonce),
        ];
      }
      const url = bundleAssetUrl(`/island-${island.id}.js`);
      imports.push([url, randomNonce] as const);
      islandImports += `\nimport ${island.name} from "${url}";`;
      islandRegistry += `\n  ${island.id}: ${island.name},`;
    }
    const initCode = `import { revive } from "${
      bundleAssetUrl("/main.js")
    }";${islandImports}\nrevive({${islandRegistry}\n});`;

    // Append the inline script to the body
    const randomNonce = crypto.randomUUID().replace(/-/g, "");
    if (csp) {
      csp.directives.scriptSrc = [
        ...csp.directives.scriptSrc ?? [],
        nonce(randomNonce),
      ];
    }
    (bodyHtml as string) +=
      `<script id="__FRSH_ISLAND_PROPS" type="application/json">${
        JSON.stringify(ISLAND_PROPS)
      }</script><script type="module" nonce="${randomNonce}">${initCode}</script>`;
  }

  const html = template({
    bodyHtml,
    headComponents,
    imports,
    preloads: opts.preloads,
    styles: ctx.styles,
    lang: ctx.lang,
  });

  return [html, csp];
}

export interface TemplateOptions {
  bodyHtml: string;
  headComponents: ComponentChildren[];
  imports: (readonly [string, string])[];
  styles: string[];
  preloads: string[];
  lang: string;
}

export function template(opts: TemplateOptions): string {
  const page = (
    <html lang={opts.lang}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {opts.preloads.map((src) => <link rel="modulepreload" href={src} />)}
        {opts.imports.map(([src, nonce]) => (
          <script src={src} nonce={nonce} type="module"></script>
        ))}
        <style
          id="__FRSH_STYLE"
          dangerouslySetInnerHTML={{ __html: opts.styles.join("\n") }}
        />
        {opts.headComponents}
      </head>
      <body dangerouslySetInnerHTML={{ __html: opts.bodyHtml }} />
    </html>
  );

  return "<!DOCTYPE html>" + renderToString(page);
}

// Set up a preact option hook to track when vnode with custom functions are
// created.
const ISLANDS: Island[] = [];
const ENCOUNTERED_ISLANDS: Set<Island> = new Set([]);
let ISLAND_PROPS: unknown[] = [];
const originalHook = options.vnode;
let ignoreNext = false;
options.vnode = (vnode) => {
  assetHashingHook(vnode);
  const originalType = vnode.type as ComponentType<unknown>;
  if (typeof vnode.type === "function") {
    const island = ISLANDS.find((island) => island.component === originalType);
    if (island) {
      if (ignoreNext) {
        ignoreNext = false;
        return;
      }
      ENCOUNTERED_ISLANDS.add(island);
      vnode.type = (props) => {
        ignoreNext = true;
        const child = h(originalType, props);
        ISLAND_PROPS.push(props);
        return h(
          `!--frsh-${island.id}:${ISLAND_PROPS.length - 1}--`,
          null,
          child,
        );
      };
    }
  }
  if (originalHook) originalHook(vnode);
};
