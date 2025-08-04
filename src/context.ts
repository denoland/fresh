import {
  type AnyComponent,
  type ComponentType,
  Fragment,
  type FunctionComponent,
  h,
  isValidElement,
  type VNode,
} from "preact";
import { SpanStatusCode } from "@opentelemetry/api";
import type { ResolvedFreshConfig } from "./config.ts";
import type { BuildCache } from "./build_cache.ts";
import type { LayoutConfig } from "./types.ts";
import { RenderState, setRenderState } from "./runtime/server/preact_hooks.tsx";
import { PARTIAL_SEARCH_PARAM } from "./constants.ts";
import { tracer } from "./otel.ts";
import {
  type ComponentDef,
  isAsyncAnyComponent,
  type PageProps,
  preactRender,
  renderAsyncAnyComponent,
  renderRouteComponent,
} from "./render.ts";

export interface Island {
  file: string;
  name: string;
  exportName: string;
  fn: ComponentType;
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
  /** The original incoming {@linkcode Request} object. */
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
    req: Request,
    url: URL,
    info: Deno.ServeHandlerInfo,
    route: string | null,
    params: Record<string, string>,
    config: ResolvedFreshConfig,
    next: () => Promise<Response>,
    buildCache: BuildCache<State>,
  ) {
    this.url = url;
    this.req = req;
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

    if (isAsyncAnyComponent(appDef)) {
      const child = vnode;
      props.Component = () => child;
      const result = await renderAsyncAnyComponent(appDef, props);
      if (result instanceof Response) {
        return result;
      }

      vnode = result;
    } else if (appDef !== null) {
      const child = vnode;
      vnode = h(appDef, {
        Component: () => child,
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

        return preactRender(
          vnode ?? h(Fragment, null),
          this,
          state,
          headers,
        );
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
        state.clear();
        setRenderState(null);

        span.end();
      }
    });
    return new Response(html, responseInit);
  }
}
