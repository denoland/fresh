import { h, VNode } from "preact";
import {
  AppModule,
  AsyncLayout,
  AsyncRoute,
  ErrorPage,
  FreshContext,
  LayoutRoute,
  PageProps,
  Plugin,
  PluginRenderFunctionResult,
  PluginRenderResult,
  RenderFunction,
  Route,
  UnknownPage,
} from "./types.ts";
import { NONE, UNSAFE_INLINE } from "../runtime/csp.ts";
import { ContentSecurityPolicy } from "../runtime/csp.ts";
import { RenderState } from "./rendering/state.ts";
import { renderHtml, renderOuterDocument } from "./rendering/template.tsx";
import { renderFreshTags } from "./rendering/fresh_tags.tsx";
import { DEV_ERROR_OVERLAY_URL } from "./constants.ts";
import { colors } from "./deps.ts";
import { withBase } from "./router.ts";

export const DEFAULT_RENDER_FN: RenderFunction = (_ctx, render) => {
  render();
};

export interface RenderOptions<Data> {
  request: Request;
  context: FreshContext;
  route: Route<Data> | UnknownPage | ErrorPage;
  plugins: Plugin[];
  app: AppModule;
  layouts: LayoutRoute[];
  imports: string[];
  dependenciesFn: (path: string) => string[];
  renderFn: RenderFunction;
  codeFrame?: string;
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

export function checkAsyncComponent<T>(
  component: unknown,
): component is AsyncRoute<T> | AsyncLayout<T> {
  return typeof component === "function" &&
    component.constructor.name === "AsyncFunction";
}

/**
 * This function renders out a page. Rendering is synchronous and non streaming.
 * Suspense boundaries are not supported.
 */
export async function render<Data>(
  opts: RenderOptions<Data>,
): Promise<[string, string, ContentSecurityPolicy | undefined] | Response> {
  const component = opts.route.component;

  // Only inherit layouts up to the nearest root layout.
  // Note that the route itself can act as the root layout.
  let layouts = opts.layouts;
  if (opts.route.inheritLayouts) {
    let rootIdx = 0;
    let layoutIdx = opts.layouts.length;
    while (layoutIdx--) {
      if (!opts.layouts[layoutIdx].inheritLayouts) {
        rootIdx = layoutIdx;
        break;
      }
    }
    layouts = opts.layouts.slice(rootIdx);
  } else {
    layouts = [];
  }

  const { params, data, state, error, url, basePath } = opts.context;

  const props: PageProps = {
    basePath,
    config: opts.context.config,
    destination: opts.context.destination,
    isPartial: opts.context.isPartial,
    params,
    error,
    codeFrame: opts.context.codeFrame,
    remoteAddr: opts.context.remoteAddr,
    localAddr: opts.context.localAddr,
    Component: () => null,
    pattern: opts.context.pattern,
    url,
    route: opts.context.route,
    data,
    state,
  };

  const csp: ContentSecurityPolicy | undefined = opts.route.csp
    ? defaultCsp()
    : undefined;
  if (csp) {
    // Clear the csp
    const newCsp = defaultCsp();
    csp.directives = newCsp.directives;
    csp.reportOnly = newCsp.reportOnly;
  }

  const ctx = new RenderContext(
    crypto.randomUUID(),
    url,
    opts.route.pattern,
    opts.lang ?? "en",
  );

  const context = opts.context;

  // Prepare render order
  // deno-lint-ignore no-explicit-any
  const renderStack: any[] = [];
  // Check if appLayout is enabled
  if (
    opts.route.appWrapper &&
    layouts.every((layout) => layout.appWrapper)
  ) {
    renderStack.push(opts.app.default);
  }
  for (let i = 0; i < layouts.length; i++) {
    renderStack.push(layouts[i].component);
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
      componentStack[i] = () => {
        return h(fn, {
          ...props,
          Component() {
            return h(componentStack[i + 1], null);
          },
          // deno-lint-ignore no-explicit-any
        } as any);
      };
    }
  }

  // CAREFUL: Rendering is synchronous internally and all state
  // should be managed through the `RenderState` instance. That
  // ensures that each render request is associated with the same
  // data.
  const renderState = new RenderState(
    crypto.randomUUID(),
    {
      url,
      route: opts.route.pattern,
      data,
      state,
      params,
      basePath,
    },
    componentStack,
    csp,
    error,
  );

  let bodyHtml: string | null = null;

  const syncPlugins = opts.plugins.filter((p) => p.render);

  const renderResults: [Plugin, PluginRenderResult][] = [];

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

      if (res.htmlText !== undefined) {
        bodyHtml = res.htmlText;
      }
    } else {
      bodyHtml = renderHtml(renderState);
    }
    if (bodyHtml === null) {
      throw new Error(
        `The 'render' function was not called by ${plugin?.name}'s render hook.`,
      );
    }
    return {
      htmlText: bodyHtml,
      requiresHydration: renderState.encounteredIslands.size > 0,
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

      if (res.htmlText !== undefined) {
        bodyHtml = res.htmlText;
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
      requiresHydration: renderState.encounteredIslands.size > 0,
    };
  }

  await renderAsync();
  if (renderState.error !== null) {
    throw renderState.error;
  }

  const idx = renderState.headVNodes.findIndex((vnode) =>
    vnode !== null && typeof vnode === "object" && "type" in vnode &&
    props !== null && vnode.type === "title"
  );
  if (idx !== -1) {
    renderState.docTitle = renderState.headVNodes[idx] as VNode<
      { children: string }
    >;
    renderState.headVNodes.splice(idx, 1);
  }

  if (asyncRenderResponse !== undefined) {
    return asyncRenderResponse;
  }

  // Includes everything inside `<body>`
  bodyHtml = bodyHtml as unknown as string;

  // Create Fresh script + style tags
  const result = renderFreshTags(renderState, {
    bodyHtml,
    imports: opts.imports,
    csp,
    dependenciesFn: opts.dependenciesFn,
    styles: ctx.styles,
    pluginRenderResults: renderResults,
    basePath,
  });

  // Append error overlay in dev mode
  if (opts.context.config.dev) {
    const devErrorUrl = withBase(DEV_ERROR_OVERLAY_URL, basePath);
    if (error !== undefined && url.pathname !== devErrorUrl) {
      const url = new URL(devErrorUrl, "https://localhost/");
      if (error instanceof Error) {
        let message = error.message;
        const idx = message.indexOf("\n");
        if (idx > -1) message = message.slice(0, idx);
        url.searchParams.append("message", message);
        if (error.stack) {
          const stack = colors.stripAnsiCode(error.stack);
          url.searchParams.append("stack", stack);
        }
      } else {
        url.searchParams.append("message", String(error));
      }
      if (opts.codeFrame) {
        const codeFrame = colors.stripAnsiCode(opts.codeFrame);
        url.searchParams.append("code-frame", codeFrame);
      }

      result.bodyHtml +=
        `<iframe id="fresh-error-overlay" src="${url.pathname}?${url.searchParams.toString()}" style="unset: all; position: fixed; top: 0; left: 0; z-index: 99999; width: 100%; height: 100%; border: none;"></iframe>`;
    }
  }

  // Render outer document up to `<body>`
  const html = renderOuterDocument(renderState, {
    bodyHtml: result.bodyHtml,
    preloads: [...result.preloadSet],
    moduleScripts: result.moduleScripts,
    lang: ctx.lang,
  });
  return [html, renderState.renderUuid, csp];
}
