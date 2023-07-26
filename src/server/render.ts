import { renderToString } from "preact-render-to-string";
import {
  Component,
  ComponentChildren,
  ComponentType,
  Fragment,
  h,
  Options as PreactOptions,
  options as preactOptions,
  VNode,
} from "preact";
import {
  AppModule,
  AsyncRoute,
  ErrorPage,
  Island,
  LayoutModule,
  LayoutRoute,
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
import { serialize } from "./serializer.ts";

export const DEFAULT_RENDER_FN: RenderFunction = (_ctx, render) => {
  render();
};

// These hooks are long stable, but when we originally added them we
// weren't sure if they should be public.
export interface AdvancedPreactOptions extends PreactOptions {
  /** Attach a hook that is invoked after a tree was mounted or was updated. */
  __c?(vnode: VNode, commitQueue: Component[]): void;
  /** Attach a hook that is invoked before a vnode has rendered. */
  __r?(vnode: VNode): void;
  errorBoundaries?: boolean;
}
const options = preactOptions as AdvancedPreactOptions;

// Enable error boundaries in Preact.
options.errorBoundaries = true;

export interface RenderOptions<Data> {
  request: Request;
  // deno-lint-ignore no-explicit-any
  context: any;
  route: Route<Data> | UnknownPage | ErrorPage;
  islands: Island[];
  plugins: Plugin[];
  app: AppModule;
  layouts: LayoutRoute[];
  imports: string[];
  dependenciesFn: (path: string) => string[];
  url: URL;
  params: Record<string, string | string[]>;
  renderFn: RenderFunction;
  data?: Data;
  state?: Record<string, unknown>;
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
 * Return a list of layouts that needs to be applied for request url
 * @param url the request url
 * @param layouts Array of layouts handlers and their routes as path-to-regexp style
 */
export function selectLayouts(url: string, layouts: LayoutRoute[]) {
  const selectedLayouts: LayoutModule[] = [];
  const reqURL = new URL(url);

  for (const layout of layouts) {
    const res = layout.compiledPattern.exec(reqURL);
    if (res) {
      selectedLayouts.push(layout);
    }
  }

  return selectedLayouts;
}

/**
 * This function renders out a page. Rendering is synchronous and non streaming.
 * Suspense boundaries are not supported.
 */
export async function render<Data>(
  opts: RenderOptions<Data>,
): Promise<[string, ContentSecurityPolicy | undefined] | Response> {
  const component = opts.route.component;
  const isAsyncComponent = typeof component === "function" &&
    component.constructor.name === "AsyncFunction";

  const props: Record<string, unknown> = {
    params: opts.params,
    url: opts.url,
    route: opts.route.pattern,
    data: opts.data,
    state: opts.state,
  };
  if (opts.error) {
    props.error = opts.error;
  }

  const csp: ContentSecurityPolicy | undefined = opts.route.csp
    ? defaultCsp()
    : undefined;
  const headComponents: ComponentChildren[] = [];
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

  const ctx = new RenderContext(
    crypto.randomUUID(),
    opts.url,
    opts.route.pattern,
    opts.lang ?? "en",
  );

  let bodyHtml: string | null = null;

  function renderInner(vnode: ComponentChildren): string {
    // deno-lint-ignore no-explicit-any
    let finalAppComp: VNode<any> = vnode as any;

    const layouts = selectLayouts(opts.url.toString(), opts.layouts);

    layouts.forEach((layout) => {
      const curComp = { ...finalAppComp };

      finalAppComp = h(layout.default, {
        params: opts.params as Record<string, string>,
        url: opts.url,
        route: opts.route.pattern,
        data: opts.data,
        state: opts.state!,
        Component() {
          return curComp;
        },
      });
    });

    const root = h(CSP_CONTEXT.Provider, {
      value: csp,
      children: h(HEAD_CONTEXT.Provider, {
        value: headComponents,
        children: h(opts.app.default, {
          params: opts.params as Record<string, string>,
          url: opts.url,
          route: opts.route.pattern,
          data: opts.data,
          state: opts.state!,
          Component() {
            return finalAppComp;
          },
        }),
      }),
    });
    bodyHtml = renderToString(root);
    return bodyHtml;
  }

  const renderResults: [Plugin, PluginRenderResult][] = [];
  const syncPlugins = opts.plugins.filter((p) => p.render);
  if (isAsyncComponent && syncPlugins.length > 0) {
    throw new Error(
      `Async server components cannot be rendered synchronously. The following plugins use a synchronous render method: "${
        syncPlugins.map((plugin) => plugin.name).join('", "')
      }"`,
    );
  }

  function renderSync(): PluginRenderFunctionResult {
    const plugin = syncPlugins.shift();
    if (plugin) {
      const res = plugin.render!({ render: renderSync });
      if (res === undefined) {
        throw new Error(
          `${plugin?.name}'s render hook did not return a PluginRenderResult object.`,
        );
      }
      renderResults.push([plugin, res]);
    } else {
      renderInner(h(component as ComponentType, props));
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

  const asyncPlugins = opts.plugins.filter((p) => p.renderAsync);

  let asyncRenderResponse: Response | undefined;
  async function renderAsync(): Promise<PluginRenderFunctionResult> {
    const plugin = asyncPlugins.shift();
    if (plugin) {
      const res = await plugin.renderAsync!({ renderAsync });
      if (res === undefined) {
        throw new Error(
          `${plugin?.name}'s async render hook did not return a PluginRenderResult object.`,
        );
      }
      renderResults.push([plugin, res]);
      if (bodyHtml === null) {
        throw new Error(
          `The 'renderAsync' function was not called by ${plugin?.name}'s async render hook.`,
        );
      }
    } else {
      if (isAsyncComponent) {
        if (opts.renderFn !== DEFAULT_RENDER_FN) {
          throw new Error(
            `Async server components are not supported with custom render functions.`,
          );
        }

        // deno-lint-ignore no-explicit-any
        const res = await (component as AsyncRoute<any>)(opts.request, {
          localAddr: opts.context.localAddr,
          remoteAddr: opts.context.remoteAddr,
          renderNotFound: opts.context.renderNotFound,
          url: opts.url,
          route: opts.route.pattern,
          params: opts.params as Record<string, string>,
          state: opts.state ?? {},
        });
        if (res instanceof Response) {
          asyncRenderResponse = res;
          bodyHtml = "";
        } else {
          renderInner(res);
        }
      } else {
        await opts.renderFn(ctx, () => renderSync().htmlText);
      }

      if (bodyHtml === null) {
        throw new Error(
          `The 'render' function was not called by the legacy async render hook.`,
        );
      }
    }
    return {
      htmlText: bodyHtml,
      requiresHydration: ENCOUNTERED_ISLANDS.size > 0,
    };
  }

  await renderAsync();
  if (asyncRenderResponse !== undefined) {
    return asyncRenderResponse;
  }

  bodyHtml = bodyHtml as unknown as string;

  let randomNonce: undefined | string;
  function getRandomNonce(): string {
    if (randomNonce === undefined) {
      randomNonce = crypto.randomUUID().replace(/-/g, "");
      if (csp) {
        csp.directives.scriptSrc = [
          ...csp.directives.scriptSrc ?? [],
          nonce(randomNonce),
        ];
      }
    }
    return randomNonce;
  }

  const moduleScripts: [string, string][] = [];
  for (const url of opts.imports) {
    moduleScripts.push([url, getRandomNonce()]);
  }

  const preloadSet = new Set<string>();
  function addImport(path: string): string {
    const url = bundleAssetUrl(`/${path}`);
    preloadSet.add(url);
    for (const depPath of opts.dependenciesFn(path)) {
      const url = bundleAssetUrl(`/${depPath}`);
      preloadSet.add(url);
    }
    return url;
  }

  const state: [islands: unknown[], plugins: unknown[]] = [ISLAND_PROPS, []];
  const styleTags: PluginRenderStyleTag[] = [];
  const pluginScripts: [string, string, number][] = [];

  for (const [plugin, res] of renderResults) {
    for (const hydrate of res.scripts ?? []) {
      const i = state[1].push(hydrate.state) - 1;
      pluginScripts.push([plugin.name, hydrate.entrypoint, i]);
    }
    styleTags.splice(styleTags.length, 0, ...res.styles ?? []);
  }

  // The inline script that will hydrate the page.
  let script = "";

  // Serialize the state into the <script id=__FRSH_STATE> tag and generate the
  // inline script to deserialize it. This script starts by deserializing the
  // state in the tag. This potentially requires importing @preact/signals.
  if (state[0].length > 0 || state[1].length > 0) {
    const res = serialize(state);
    const escapedState = htmlEscapeJsonString(res.serialized);
    bodyHtml +=
      `<script id="__FRSH_STATE" type="application/json">${escapedState}</script>`;

    if (res.requiresDeserializer) {
      const url = addImport("deserializer.js");
      script += `import { deserialize } from "${url}";`;
    }
    if (res.hasSignals) {
      const url = addImport("signals.js");
      script += `import { signal } from "${url}";`;
    }
    script += `const ST = document.getElementById("__FRSH_STATE").textContent;`;
    script += `const STATE = `;
    if (res.requiresDeserializer) {
      if (res.hasSignals) {
        script += `deserialize(ST, signal);`;
      } else {
        script += `deserialize(ST);`;
      }
    } else {
      script += `JSON.parse(ST).v;`;
    }
  }

  // Then it imports all plugin scripts and executes them (with their respective
  // state).
  for (const [pluginName, entrypoint, i] of pluginScripts) {
    const url = addImport(`plugin-${pluginName}-${entrypoint}.js`);
    script += `import p${i} from "${url}";p${i}(STATE[1][${i}]);`;
  }

  // Finally, it loads all island scripts and hydrates the islands using the
  // reviver from the "main" script.
  if (ENCOUNTERED_ISLANDS.size > 0) {
    // Load the main.js script
    const url = addImport("main.js");
    script += `import { revive } from "${url}";`;

    // Prepare the inline script that loads and revives the islands
    let islandRegistry = "";
    for (const island of ENCOUNTERED_ISLANDS) {
      const url = addImport(`island-${island.id}.js`);
      script +=
        `import * as ${island.name}_${island.exportName} from "${url}";`;
      islandRegistry += `${island.id}:${island.name}_${island.exportName},`;
    }
    script += `revive({${islandRegistry}}, STATE[0]);`;
  }

  // Append the inline script.
  if (script !== "") {
    bodyHtml +=
      `<script type="module" nonce="${getRandomNonce()}">${script}</script>`;
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

  const preloads = [...preloadSet];
  const html = template({
    bodyHtml,
    headComponents,
    moduleScripts,
    preloads,
    lang: ctx.lang,
  });

  return [html, csp];
}

export interface TemplateOptions {
  bodyHtml: string;
  headComponents: ComponentChildren[];
  moduleScripts: (readonly [string, string])[];
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
      opts.moduleScripts.map(([src, nonce]) =>
        h("script", { src: src, nonce: nonce, type: "module" })
      ),
      opts.headComponents,
    ),
    h("body", { dangerouslySetInnerHTML: { __html: opts.bodyHtml } }),
  );
  return "<!DOCTYPE html>" + renderToString(page);
}

const supportsUnstableComments = renderToString(h(Fragment, {
  // @ts-ignore unstable features not supported in types
  UNSTABLE_comment: "foo",
})) !== "";

if (!supportsUnstableComments) {
  console.warn(
    "⚠️  Found old version of 'preact-render-to-string'. Please upgrade it to >=6.1.0",
  );
}

function wrapWithMarker(vnode: ComponentChildren, markerText: string) {
  // Newer versions of preact-render-to-string allow you to render comments
  if (supportsUnstableComments) {
    return h(
      Fragment,
      null,
      h(Fragment, {
        // @ts-ignore unstable property is not typed
        UNSTABLE_comment: markerText,
      }),
      vnode,
      h(Fragment, {
        // @ts-ignore unstable property is not typed
        UNSTABLE_comment: "/" + markerText,
      }),
    );
  } else {
    return h(
      `!--${markerText}--`,
      null,
      vnode,
    );
  }
}

// Set up a preact option hook to track when vnode with custom functions are
// created.
const ISLANDS: Island[] = [];
const ENCOUNTERED_ISLANDS: Set<Island> = new Set([]);
let ISLAND_PROPS: unknown[] = [];

// Keep track of which component rendered which vnode. This allows us
// to detect when an island is rendered within another instead of being
// passed as children.
let ownerStack: VNode[] = [];
const islandOwners = new Map<VNode, VNode>();

const originalHook = options.vnode;
let ignoreNext = false;
options.vnode = (vnode) => {
  assetHashingHook(vnode);
  const originalType = vnode.type as ComponentType<unknown>;

  // Use a labelled statement that allows ous to break out of it
  // whilst still continuing execution. We still want to call previous
  // `options.vnode` hooks if there were any, otherwise we'd break
  // the change for other plugins hooking into Preact.
  patchIslands:
  if (typeof vnode.type === "function") {
    const island = ISLANDS.find((island) => island.component === originalType);
    if (island) {
      const hasOwners = ownerStack.length > 0;
      if (hasOwners) {
        const prevOwner = ownerStack[ownerStack.length - 1];
        islandOwners.set(vnode, prevOwner);
      }

      // Check if we already patched this component
      if (ignoreNext) {
        ignoreNext = false;
        break patchIslands;
      }

      // Check if an island is rendered inside another island, not just
      // passed as a child. Example:
      //   function Island() {}
      //     return <OtherIsland />
      //   }
      if (hasOwners) {
        const prevOwner = ownerStack[ownerStack.length - 1];
        if (islandOwners.has(prevOwner)) {
          break patchIslands;
        }
      }

      ENCOUNTERED_ISLANDS.add(island);
      vnode.type = (props) => {
        ignoreNext = true;

        // Only passing children JSX to islands is supported for now
        if ("children" in props) {
          const children = props.children;
          // @ts-ignore nonono
          props.children = wrapWithMarker(
            children,
            `frsh-slot-${island.id}:children`,
          );
        }

        const child = h(originalType, props);
        ISLAND_PROPS.push(props);

        return wrapWithMarker(
          child,
          `frsh-${island.id}:${island.exportName}:${ISLAND_PROPS.length - 1}`,
        );
      };
    }
  } else if (typeof vnode.type === "string" && vnode.props !== null) {
    // Work around `preact/debug` string event handler error which
    // errors when an event handler gets a string. This makes sense
    // on the client where this is a common vector for XSS. On the
    // server when the string was not created through concatenation
    // it is fine. Internally, `preact/debug` only checks for the
    // lowercase variant.
    const props = vnode.props as Record<string, unknown>;
    for (const key in props) {
      const value = props[key];
      if (key.startsWith("on") && typeof value === "string") {
        delete props[key];
        props["ON" + key.slice(2)] = value;
      }
    }
  }

  if (originalHook) originalHook(vnode);
};

// Keep track of owners
const oldDiffed = options.diffed;
const oldRender = options.__r;
const oldCommit = options.__c;
options.__r = (vnode) => {
  if (
    typeof vnode.type === "function" &&
    vnode.type !== Fragment
  ) {
    ownerStack.push(vnode);
  }
  oldRender?.(vnode);
};
options.diffed = (vnode) => {
  if (typeof vnode.type === "function") {
    if (vnode.type !== Fragment) {
      ownerStack.pop();
    }
  }
  oldDiffed?.(vnode);
};
options.__c = (vnode, queue) => {
  oldCommit?.(vnode, queue);
  ownerStack = [];
  islandOwners.clear();
};
