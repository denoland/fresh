import { renderToString } from "preact-render-to-string";
import { ComponentChildren, ComponentType, h, options } from "preact";
import {
  AppModule,
  ErrorPage,
  Island,
  Plugin,
  PluginRenderFunctionResult,
  PluginRenderResult,
  PluginRenderStyleTag,
  RenderFunction,
  Route,
  UnknownPage,
} from "./types.ts";
import { HEAD_CONTEXT } from "../runtime/head.ts";
import { CSP_CONTEXT, nonce, NONE, UNSAFE_INLINE } from "../runtime/csp.ts";
import { ContentSecurityPolicy } from "../runtime/csp.ts";
import { bundleAssetUrl } from "./constants.ts";
import { assetHashingHook } from "../runtime/utils.ts";
import { htmlEscapeJsonString } from "./htmlescape.ts";

export interface RenderOptions<Data> {
  route: Route<Data> | UnknownPage | ErrorPage;
  islands: Island[];
  plugins: Plugin[];
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
 * This function renders out a page. Rendering is synchronous and non streaming.
 * Suspense boundaries are not supported.
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

  function realRender(): string {
    bodyHtml = renderToString(vnode);
    return bodyHtml;
  }

  const plugins = opts.plugins.filter((p) => p.render !== null);
  const renderResults: [Plugin, PluginRenderResult][] = [];

  function render(): PluginRenderFunctionResult {
    const plugin = plugins.shift();
    if (plugin) {
      const res = plugin.render!({ render });
      if (res === undefined) {
        throw new Error(
          `${plugin?.name}'s render hook did not return a PluginRenderResult object.`,
        );
      }
      renderResults.push([plugin, res]);
    } else {
      realRender();
    }
    if (bodyHtml === null) {
      throw new Error(
        `The 'render' function was not called by ${plugin?.name}'s render hook.`,
      );
    }
    return {
      htmlText: bodyHtml,
      requiresHydration: ENCOUNTERED_ISLANDS.size > 0,
    };
  }

  await opts.renderFn(ctx, () => render().htmlText);

  if (bodyHtml === null) {
    throw new Error("The `render` function was not called by the renderer.");
  }

  bodyHtml = bodyHtml as string;

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

  const state: [islands: unknown[], plugins: unknown[]] = [ISLAND_PROPS, []];
  const styleTags: PluginRenderStyleTag[] = [];

  let script =
    `const STATE_COMPONENT = document.getElementById("__FRSH_STATE");const STATE = JSON.parse(STATE_COMPONENT?.textContent ?? "[[],[]]");`;

  for (const [plugin, res] of renderResults) {
    for (const hydrate of res.scripts ?? []) {
      const i = state[1].push(hydrate.state) - 1;
      const randomNonce = crypto.randomUUID().replace(/-/g, "");
      if (csp) {
        csp.directives.scriptSrc = [
          ...csp.directives.scriptSrc ?? [],
          nonce(randomNonce),
        ];
      }
      const url = bundleAssetUrl(
        `/plugin-${plugin.name}-${hydrate.entrypoint}.js`,
      );
      imports.push([url, randomNonce] as const);

      script += `import p${i} from "${url}";p${i}(STATE[1][${i}]);`;
    }
    styleTags.splice(styleTags.length, 0, ...res.styles ?? []);
  }

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

    script += `import { revive } from "${bundleAssetUrl("/main.js")}";`;

    // Prepare the inline script that loads and revives the islands
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
      script += `import ${island.name} from "${url}";`;
      islandRegistry += `${island.id}:${island.name},`;
    }
    script += `try { revive({${islandRegistry}}, STATE[0]); } catch(err) { console.log("revive err", err);throw err; };`;
  }

  if (state[0].length > 0 || state[1].length > 0) {
    // Append state to the body
    bodyHtml += `<script id="__FRSH_STATE" type="application/json">${
      htmlEscapeJsonString(JSON.stringify(state))
    }</script>`;

    // Append the inline script to the body
    const randomNonce = crypto.randomUUID().replace(/-/g, "");
    if (csp) {
      csp.directives.scriptSrc = [
        ...csp.directives.scriptSrc ?? [],
        nonce(randomNonce),
      ];
    }
    bodyHtml +=
      `<script type="module" nonce="${randomNonce}">${script}</script>`;
  }

  if (ctx.styles.length > 0) {
    const node = h("style", {
      id: "__FRSH_STYLE",
      dangerouslySetInnerHTML: { __html: ctx.styles.join("\n") },
    });
    headComponents.splice(0, 0, node);
  }

  for (const style of styleTags) {
    const node = h("style", {
      id: style.id,
      dangerouslySetInnerHTML: { __html: style.cssText },
      media: style.media,
    });
    headComponents.splice(0, 0, node);
  }

  const html = template({
    bodyHtml,
    headComponents,
    imports,
    preloads: opts.preloads,
    lang: ctx.lang,
  });

  return [html, csp];
}

export interface TemplateOptions {
  bodyHtml: string;
  headComponents: ComponentChildren[];
  imports: (readonly [string, string])[];
  preloads: string[];
  lang: string;
}

export function template(opts: TemplateOptions): string {
  const page = h(
    "html",
    { lang: opts.lang },
    h(
      "head",
      null,
      h("meta", { charSet: "UTF-8" }),
      h("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0",
      }),
      opts.preloads.map((src) =>
        h("link", { rel: "modulepreload", href: src })
      ),
      opts.imports.map(([src, nonce]) =>
        h("script", { src: src, nonce: nonce, type: "module" })
      ),
      opts.headComponents,
    ),
    h("body", { dangerouslySetInnerHTML: { __html: opts.bodyHtml } }),
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
