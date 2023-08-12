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
  AsyncLayout,
  AsyncRoute,
  ErrorPage,
  Island,
  LayoutModule,
  Plugin,
  PluginRenderFunctionResult,
  PluginRenderResult,
  PluginRenderStyleTag,
  RenderFunction,
  Route,
  RouteContext,
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
  /** before diff hook */
  __b?(vnode: VNode): void;
}
const options = preactOptions as AdvancedPreactOptions;

// Enable error boundaries in Preact.
options.errorBoundaries = true;

// These values keep track of whether the user rendered the <html>,
// <head> and <body> element. Basically, the outer document. We
// keep track of this, because we only know the full sets of
// elements we should put in `<head>` after having completed
// rendering the page.
let RENDERING_USER_TEMPLATE = false;
interface OuterDocument {
  // deno-lint-ignore no-explicit-any
  title: VNode<any> | null;
  html: Record<string, unknown> | null;
  head: Record<string, unknown> | null;
  body: Record<string, unknown> | null;
  headNodes: { type: string; props: Record<string, unknown> }[];
}
let OUTER_DOCUMENT: OuterDocument = {
  title: null,
  html: null,
  head: null,
  body: null,
  headNodes: [],
};

export interface RenderOptions<Data> {
  request: Request;
  // deno-lint-ignore no-explicit-any
  context: any;
  route: Route<Data> | UnknownPage | ErrorPage;
  islands: Island[];
  plugins: Plugin[];
  app: AppModule;
  layouts: LayoutModule[];
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

function checkAsyncComponent(
  component: unknown,
): component is AsyncRoute | AsyncLayout {
  return typeof component === "function" &&
    component.constructor.name === "AsyncFunction";
}

/**
 * This function renders out a page. Rendering is synchronous and non streaming.
 * Suspense boundaries are not supported.
 */
export async function render<Data>(
  opts: RenderOptions<Data>,
): Promise<[string, ContentSecurityPolicy | undefined] | Response> {
  const component = opts.route.component;

  // Only inherit layouts up to the nearest root layout.
  // Note that the route itself can act as the root layout.
  let layouts = opts.layouts;
  if (!opts.route.rootLayout) {
    let rootIdx = 0;
    let layoutIdx = opts.layouts.length;
    while (layoutIdx--) {
      if (opts.layouts[layoutIdx].config?.rootLayout) {
        rootIdx = layoutIdx;
        break;
      }
    }
    layouts = opts.layouts.slice(rootIdx);
  } else {
    layouts = [];
  }

  const isAsyncComponent = checkAsyncComponent(component);

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
  // Clear previous slots
  SLOTS_TRACKER.clear();

  // Clear rendering state
  RENDERING_USER_TEMPLATE = false;
  headChildren = false;
  OUTER_DOCUMENT = {
    title: null,
    body: null,
    head: null,
    html: null,
    headNodes: [],
  };

  const ctx = new RenderContext(
    crypto.randomUUID(),
    opts.url,
    opts.route.pattern,
    opts.lang ?? "en",
  );

  const context: RouteContext = {
    localAddr: opts.context.localAddr,
    remoteAddr: opts.context.remoteAddr,
    renderNotFound: opts.context.renderNotFound,
    url: opts.url,
    route: opts.route.pattern,
    params: opts.params as Record<string, string>,
    state: opts.state ?? {},
    data: opts.data,
  };

  // Prepare render order
  // deno-lint-ignore no-explicit-any
  const renderStack: any[] = [];
  // Check if appLayout is enabled
  if (
    opts.route.appLayout &&
    layouts.every((layout) => layout.config?.appTemplate !== false)
  ) {
    renderStack.push(opts.app.default);
  }
  for (let i = 0; i < layouts.length; i++) {
    renderStack.push(layouts[i].default);
  }
  renderStack.push(component);

  // Build the final stack of component functions
  const componentStack = new Array(renderStack.length).fill(null);
  for (let i = 0; i < renderStack.length; i++) {
    const fn = renderStack[i];
    if (!fn) continue;

    if (checkAsyncComponent(fn)) {
      // Don't pass <Component /> when it's the route component
      const isRouteComponent = fn === component;
      const componentCtx = isRouteComponent ? context : {
        ...context,
        Component() {
          return h(componentStack[i + 1], props);
        },
      };
      // deno-lint-ignore no-explicit-any
      const res = await fn(opts.request, componentCtx as any);

      // Bail out of rendering if we returned a response
      if (res instanceof Response) {
        return res;
      }

      const componentFn = () => res;
      // Set displayName to make debugging easier
      // deno-lint-ignore no-explicit-any
      componentFn.displayName = (fn as any).displayName || fn.name;
      componentStack[i] = componentFn;
    } else {
      componentStack[i] = fn;
    }
  }

  function render() {
    const routeComponent = componentStack[componentStack.length - 1];
    let finalComp = h(routeComponent, props);

    // Skip page component
    let i = componentStack.length - 1;
    while (i--) {
      const component = componentStack[i];
      const curComp = finalComp;

      finalComp = h(component, {
        // @ts-ignore weird jsx types
        params: opts.params as Record<string, string>,
        url: opts.url,
        route: opts.route.pattern,
        data: opts.data,
        state: opts.state!,
        Component() {
          return curComp;
        },
      });
    }

    const app = h(CSP_CONTEXT.Provider, {
      value: csp,
      children: h(HEAD_CONTEXT.Provider, {
        value: headComponents,
        children: finalComp,
      }),
    });

    let html = renderToString(app);

    for (const [id, children] of SLOTS_TRACKER.entries()) {
      const slotHtml = renderToString(h(Fragment, null, children));
      const templateId = id.replace(/:/g, "-");
      html += `<template id="${templateId}">${slotHtml}</template>`;
    }

    return html;
  }

  let bodyHtml: string | null = null;

  const syncPlugins = opts.plugins.filter((p) => p.render);

  const renderResults: [Plugin, PluginRenderResult][] = [];
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
      bodyHtml = render();
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
      await opts.renderFn(ctx, () => renderSync().htmlText);

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

  RENDERING_USER_TEMPLATE = true;
  await renderAsync();
  RENDERING_USER_TEMPLATE = false;

  const idx = headComponents.findIndex((vnode) =>
    vnode !== null && typeof vnode === "object" && "type" in vnode &&
    props !== null && vnode.type === "title"
  );
  if (idx !== -1) {
    OUTER_DOCUMENT.title = headComponents[idx] as VNode<{ children: string }>;
    headComponents.splice(idx, 1);
  }

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

  const page = h(
    "html",
    OUTER_DOCUMENT.html ?? { lang: ctx.lang },
    h(
      "head",
      OUTER_DOCUMENT.head,
      // Add some tags ourselves if the user uses the legacy
      // _app template rendering style where we provided the outer
      // HTML document.
      !renderedHtmlTag ? h("meta", { charSet: "UTF-8" }) : null,
      !renderedHtmlTag
        ? h("meta", {
          name: "viewport",
          content: "width=device-width, initial-scale=1.0",
        })
        : null,
      OUTER_DOCUMENT.title,
      OUTER_DOCUMENT.headNodes.map((node) => h(node.type, node.props)),
      // Fresh scripts
      preloads.map((src) => h("link", { rel: "modulepreload", href: src })),
      moduleScripts.map(([src, nonce]) =>
        h("script", { src: src, nonce: nonce, type: "module" })
      ),
      headComponents,
    ),
    h("body", { dangerouslySetInnerHTML: { __html: bodyHtml } }),
  );
  const html = "<!DOCTYPE html>" + renderToString(page);

  return [html, csp];
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
// Track unused slots
const SLOTS_TRACKER = new Map<string, ComponentChildren>();
function SlotTracker(
  props: { id: string; children?: ComponentChildren },
): VNode {
  SLOTS_TRACKER.delete(props.id);
  // deno-lint-ignore no-explicit-any
  return props.children as any;
}

// Keep track of which component rendered which vnode. This allows us
// to detect when an island is rendered within another instead of being
// passed as children.
let ownerStack: VNode[] = [];
const islandOwners = new Map<VNode, VNode>();

const originalHook = options.vnode;
let ignoreNext = false;
let headChildren = false;
let renderedHtmlTag = false;
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

        const id = ISLAND_PROPS.length;

        // Only passing children JSX to islands is supported for now
        if ("children" in props) {
          let children = props.children;
          const markerText =
            `frsh-slot-${island.id}:${island.exportName}:${id}:children`;
          // @ts-ignore nonono
          props.children = wrapWithMarker(
            children,
            markerText,
          );
          SLOTS_TRACKER.set(markerText, children);
          children = props.children;
          // deno-lint-ignore no-explicit-any
          (props as any).children = h(
            SlotTracker,
            { id: markerText },
            children,
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
  } else {
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

function excludeChildren(props: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k in props) {
    if (k !== "children") out[k] = props[k];
  }
  return out;
}

// Keep track of owners
const oldDiff = options.__b;
const oldDiffed = options.diffed;
const oldRender = options.__r;
const oldCommit = options.__c;
options.__b = (vnode: VNode<Record<string, unknown>>) => {
  if (RENDERING_USER_TEMPLATE && typeof vnode.type === "string") {
    if (vnode.type === "html") {
      renderedHtmlTag = true;
      OUTER_DOCUMENT.html = excludeChildren(vnode.props);
      vnode.type = Fragment;
    } else if (vnode.type === "head") {
      OUTER_DOCUMENT.head = excludeChildren(vnode.props);
      headChildren = true;
      vnode.type = Fragment;
      vnode.props = {
        __freshHead: true,
        children: vnode.props.children,
      };
    } else if (vnode.type === "body") {
      OUTER_DOCUMENT.body = excludeChildren(vnode.props);
      vnode.type = Fragment;
    } else if (headChildren) {
      if (vnode.type === "title") {
        OUTER_DOCUMENT.title = h("title", vnode.props);
        vnode.props = { children: null };
      } else {
        OUTER_DOCUMENT.headNodes.push({ type: vnode.type, props: vnode.props });
      }
      vnode.type = Fragment;
    }
  }
  oldDiff?.(vnode);
};
options.__r = (vnode) => {
  if (
    typeof vnode.type === "function" &&
    vnode.type !== Fragment
  ) {
    ownerStack.push(vnode);
  }
  oldRender?.(vnode);
};
options.diffed = (vnode: VNode<Record<string, unknown>>) => {
  if (typeof vnode.type === "function") {
    if (vnode.type !== Fragment) {
      ownerStack.pop();
    } else if (vnode.props.__freshHead) {
      headChildren = false;
    }
  }
  oldDiffed?.(vnode);
};
options.__c = (vnode, queue) => {
  oldCommit?.(vnode, queue);
  ownerStack = [];
  islandOwners.clear();
};
