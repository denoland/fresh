import {
  type AnyComponent,
  type ComponentType,
  Fragment,
  type FunctionComponent,
  h,
  isValidElement,
  type VNode,
} from "preact";
import { jsxTemplate } from "preact/jsx-runtime";
import { SpanStatusCode } from "@opentelemetry/api";
import type { ResolvedFreshConfig } from "./config.ts";
import type { BuildCache } from "./build_cache.ts";
import type { LayoutConfig } from "./types.ts";
import {
  FreshScripts,
  RenderState,
  setRenderState,
} from "./runtime/server/preact_hooks.ts";
import { DEV_ERROR_OVERLAY_URL, PARTIAL_SEARCH_PARAM } from "./constants.ts";
import { tracer } from "./otel.ts";
import {
  type ComponentDef,
  isAsyncAnyComponent,
  type PageProps,
  renderAsyncAnyComponent,
  renderRouteComponent,
} from "./render.ts";
import { renderToString } from "preact-render-to-string";

export interface Island {
  file: string;
  name: string;
  exportName: string;
  fn: ComponentType;
  css: string[];
}

export type ServerIslandRegistry = Map<ComponentType, Island>;

export const internals: unique symbol = Symbol("fresh_internal");

export interface UiTree<Data, State> {
  app: AnyComponent<PageProps<Data, State>> | null;
  layouts: ComponentDef<Data, State>[];
}

/**
 * @deprecated Use {@linkcode Context} instead.
 */
export type FreshContext<State = unknown> = Context<State>;

export let getBuildCache: <T>(ctx: Context<T>) => BuildCache<T>;
export let getInternals: <T>(ctx: Context<T>) => UiTree<unknown, T>;

/**
 * The context passed to every middleware. It is unique for every request.
 */
export class Context<State> {
  #internal: UiTree<unknown, State> = {
    app: null,
    layouts: [],
  };
  /** Reference to the resolved Fresh configuration */
  readonly config: ResolvedFreshConfig;
  /**
   * The request url parsed into an `URL` instance. This is typically used
   * to apply logic based on the pathname of the incoming url or when
   * certain search parameters are set.
   */
  readonly url: URL;
  /** The original incoming `Request` object` */
  readonly request: Request;
  /** @deprecated This is an alias for internal use only. Use {@linkcode FreshContext[request]} instead. */
  readonly req: Request;
  /** The matched route pattern. */
  readonly route: string | null;
  /** The url parameters of the matched route pattern. */
  readonly params: Record<string, string>;
  /** State object that is shared with all middlewares. */
  readonly state: State = {} as State;
  data: unknown = undefined;
  /** Error value if an error was caught (Default: null) */
  error: unknown | null = null;
  readonly info: Deno.ServeHandlerInfo | Deno.ServeHandlerInfo;
  /**
   * Whether the current Request is a partial request.
   *
   * Partials in Fresh will append the query parameter
   * {@linkcode PARTIAL_SEARCH_PARAM} to the URL. This property can
   * be used to determine if only `<Partial>`'s need to be rendered.
   */
  readonly isPartial: boolean;

  /**
   * Call the next middleware.
   * ```ts
   * const myMiddleware: Middleware = (ctx) => {
   *   // do something
   *
   *   // Call the next middleware
   *   return ctx.next();
   * }
   *
   * const myMiddleware2: Middleware = async (ctx) => {
   *   // do something before the next middleware
   *   doSomething()
   *
   *   const res = await ctx.next();
   *
   *   // do something after the middleware
   *   doSomethingAfter()
   *
   *   // Return the `Response`
   *   return res
   * }
   */
  next: () => Promise<Response>;

  #buildCache: BuildCache<State>;

  Component!: FunctionComponent;

  static {
    // deno-lint-ignore no-explicit-any
    getInternals = <T>(ctx: Context<T>) => ctx.#internal as any;
    getBuildCache = <T>(ctx: Context<T>) => ctx.#buildCache;
  }

  constructor(
    request: Request,
    url: URL,
    info: Deno.ServeHandlerInfo,
    route: string | null,
    params: Record<string, string>,
    config: ResolvedFreshConfig,
    next: () => Promise<Response>,
    buildCache: BuildCache<State>,
  ) {
    this.url = url;
    this.request = request;
    this.req = request;
    this.info = info;
    this.params = params;
    this.route = route;
    this.config = config;
    this.isPartial = url.searchParams.has(PARTIAL_SEARCH_PARAM);
    this.next = next;
    this.#buildCache = buildCache;
  }

  /**
   * Return a redirect response to the specified path. This is the
   * preferred way to do redirects in Fresh.
   *
   * ```ts
   * ctx.redirect("/foo/bar") // redirect user to "<yoursite>/foo/bar"
   *
   * // Disallows protocol relative URLs for improved security. This
   * // redirects the user to `<yoursite>/evil.com` which is safe,
   * // instead of redirecting to `http://evil.com`.
   * ctx.redirect("//evil.com/");
   * ```
   */
  redirect(pathOrUrl: string, status = 302): Response {
    let location = pathOrUrl;

    // Disallow protocol relative URLs
    if (pathOrUrl !== "/" && pathOrUrl.startsWith("/")) {
      let idx = pathOrUrl.indexOf("?");
      if (idx === -1) {
        idx = pathOrUrl.indexOf("#");
      }

      const pathname = idx > -1 ? pathOrUrl.slice(0, idx) : pathOrUrl;
      const search = idx > -1 ? pathOrUrl.slice(idx) : "";

      // Remove double slashes to prevent open redirect vulnerability.
      location = `${pathname.replaceAll(/\/+/g, "/")}${search}`;
    }

    return new Response(null, {
      status,
      headers: {
        location,
      },
    });
  }

  /**
   * Render JSX and return an HTML `Response` instance.
   * ```tsx
   * ctx.render(<h1>hello world</h1>);
   * ```
   */
  async render(
    // deno-lint-ignore no-explicit-any
    vnode: VNode<any> | null,
    init: ResponseInit | undefined = {},
    config: LayoutConfig = {},
  ): Promise<Response> {
    if (arguments.length === 0) {
      throw new Error(`No arguments passed to: ctx.render()`);
    } else if (vnode !== null && !isValidElement(vnode)) {
      throw new Error(`Non-JSX element passed to: ctx.render()`);
    }

    const defs = config.skipInheritedLayouts ? [] : this.#internal.layouts;
    const appDef = config.skipAppWrapper ? null : this.#internal.app;
    const props = this as Context<State>;

    // Compose final vnode tree
    for (let i = defs.length - 1; i >= 0; i--) {
      const child = vnode;
      props.Component = () => child;

      const def = defs[i];

      const result = await renderRouteComponent(this, def, () => child);
      if (result instanceof Response) {
        return result;
      }

      vnode = result;
    }

    let appChild = vnode;
    // deno-lint-ignore no-explicit-any
    let appVNode: VNode<any>;

    let hasApp = true;

    if (isAsyncAnyComponent(appDef)) {
      props.Component = () => appChild;
      const result = await renderAsyncAnyComponent(appDef, props);
      if (result instanceof Response) {
        return result;
      }

      appVNode = result;
    } else if (appDef !== null) {
      appVNode = h(appDef, {
        Component: () => appChild,
        config: this.config,
        data: null,
        error: this.error,
        info: this.info,
        isPartial: this.isPartial,
        params: this.params,
        req: this.req,
        state: this.state,
        url: this.url,
      });
    } else {
      hasApp = false;
      appVNode = appChild ?? h(Fragment, null);
    }

    const headers = init.headers !== undefined
      ? init.headers instanceof Headers
        ? init.headers
        : new Headers(init.headers)
      : new Headers();

    headers.set("Content-Type", "text/html; charset=utf-8");
    const responseInit: ResponseInit = {
      status: init.status ?? 200,
      headers,
      statusText: init.statusText,
    };

    let partialId = "";
    if (this.url.searchParams.has(PARTIAL_SEARCH_PARAM)) {
      partialId = crypto.randomUUID();
      headers.set("X-Fresh-Id", partialId);
    }

    const html = tracer.startActiveSpan("render", (span) => {
      span.setAttribute("fresh.span_type", "render");
      const state = new RenderState(
        this,
        this.#buildCache,
        partialId,
      );

      try {
        setRenderState(state);

        let html = renderToString(
          vnode ?? h(Fragment, null),
        );

        if (hasApp) {
          appChild = jsxTemplate([html]);
          html = renderToString(appVNode);
        }

        if (
          !state.renderedHtmlBody || !state.renderedHtmlHead ||
          !state.renderedHtmlTag
        ) {
          let fallback: VNode = jsxTemplate([html]);
          if (!state.renderedHtmlBody) {
            let scripts: VNode | null = null;

            if (
              this.url.pathname !== this.config.basePath + DEV_ERROR_OVERLAY_URL
            ) {
              scripts = h(FreshScripts, null) as VNode;
            }

            fallback = h("body", null, fallback, scripts);
          }
          if (!state.renderedHtmlHead) {
            fallback = h(
              Fragment,
              null,
              h("head", null, h("meta", { charset: "utf-8" })),
              fallback,
            );
          }
          if (!state.renderedHtmlTag) {
            fallback = h("html", null, fallback);
          }

          html = renderToString(fallback);
        }

        return `<!DOCTYPE html>${html}`;
      } catch (err) {
        if (err instanceof Error) {
          span.recordException(err);
        } else {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: String(err),
          });
        }
        throw err;
      } finally {
        // Add preload headers
        const basePath = this.config.basePath;
        const runtimeUrl = state.buildCache.clientEntry.startsWith(".")
          ? state.buildCache.clientEntry.slice(1)
          : state.buildCache.clientEntry;
        let link = `<${
          encodeURI(`${basePath}${runtimeUrl}`)
        }>; rel="modulepreload"; as="script"`;
        state.islands.forEach((island) => {
          const specifier = `${basePath}${
            island.file.startsWith(".") ? island.file.slice(1) : island.file
          }`;
          link += `, <${
            encodeURI(specifier)
          }>; rel="modulepreload"; as="script"`;
        });

        if (link !== "") {
          headers.append("Link", link);
        }

        state.clear();
        setRenderState(null);

        span.end();
      }
    });
    return new Response(html, responseInit);
  }
}
