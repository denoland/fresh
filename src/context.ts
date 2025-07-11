import {
  type AnyComponent,
  type ComponentType,
  Fragment,
  type FunctionComponent,
  h,
  isValidElement,
  type RenderableProps,
  type VNode,
} from "preact";
import { renderToString } from "preact-render-to-string";
import { SpanStatusCode } from "@opentelemetry/api";
import type { ResolvedFreshConfig } from "./config.ts";
import type { BuildCache } from "./build_cache.ts";
import {
  FreshScripts,
  RenderState,
  setRenderState,
} from "./runtime/server/preact_hooks.tsx";
import { DEV_ERROR_OVERLAY_URL, PARTIAL_SEARCH_PARAM } from "./constants.ts";
import { BUILD_ID } from "./runtime/build_id.ts";
import { recordSpanError, tracer } from "./otel.ts";
import {
  type AsyncAnyComponent,
  isAsyncAnyComponent,
} from "./plugins/fs_routes/render_middleware.ts";
import { RouteComponent } from "./segments.ts";
import { LayoutConfig } from "./types.ts";

export interface Island {
  file: string | URL;
  name: string;
  exportName: string;
  fn: ComponentType;
}

export type ServerIslandRegistry = Map<ComponentType, Island>;

export const internals: unique symbol = Symbol("fresh_internal");

export interface SegmentLayout<Data, State> {
  app: AnyComponent<PageProps<Data, State>> | null;
  layouts: ComponentDef<Data, State>[];
}

export interface ComponentDef<Data, State> {
  props: PageProps<Data, State> | null;
  component: AnyComponent<PageProps<Data, State>>;
}

/**
 * The context passed to every middleware. It is unique for every request.
 */
export interface FreshContext<State = unknown> {
  readonly __internal: SegmentLayout<unknown, State>;

  /** Reference to the resolved Fresh configuration */
  readonly config: ResolvedFreshConfig;
  readonly state: State;
  /** The original incoming `Request` object` */
  readonly req: Request;
  /**
   * The request url parsed into an `URL` instance. This is typically used
   * to apply logic based on the pathname of the incoming url or when
   * certain search parameters are set.
   */
  readonly url: URL;
  readonly params: Record<string, string>;
  readonly info: Deno.ServeHandlerInfo;
  error: unknown;
  /**
   * Whether the current Request is a partial request.
   *
   * Partials in Fresh will append the query parameter
   * {@linkcode PARTIAL_SEARCH_PARAM} to the URL. This property can
   * be used to determine if only `<Partial>`'s need to be rendered.
   */
  readonly isPartial: boolean;
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
  redirect(path: string, status?: number): Response;
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
  next(): Promise<Response>;
  render(
    vnode: VNode | null,
    init?: ResponseInit,
  ): Response | Promise<Response>;
}

export let getBuildCache: <T>(ctx: FreshContext<T>) => BuildCache;

export class FreshReqContext<State>
  implements FreshContext<State>, PageProps<unknown, State> {
  readonly __internal: SegmentLayout<unknown, State> = {
    app: null,
    layouts: [],
  };
  readonly config: ResolvedFreshConfig;
  readonly url: URL;
  readonly req: Request;
  readonly params: Record<string, string>;
  readonly state: State = {} as State;
  data: unknown = undefined;
  error: unknown | null = null;
  readonly info: Deno.ServeHandlerInfo | Deno.ServeHandlerInfo;
  readonly isPartial: boolean;

  next: FreshContext<State>["next"];

  #islandRegistry: ServerIslandRegistry;
  #buildCache: BuildCache;

  // FIXME: remove after switching to <Slot />
  Component!: FunctionComponent;

  static {
    getBuildCache = (ctx) => (ctx as FreshReqContext<unknown>).#buildCache;
  }

  constructor(
    req: Request,
    url: URL,
    info: Deno.ServeHandlerInfo,
    params: Record<string, string>,
    config: ResolvedFreshConfig,
    next: FreshContext<State>["next"],
    islandRegistry: ServerIslandRegistry,
    buildCache: BuildCache,
  ) {
    this.url = url;
    this.req = req;
    this.info = info;
    this.params = params;
    this.config = config;
    this.isPartial = url.searchParams.has(PARTIAL_SEARCH_PARAM);
    this.next = next;
    this.#islandRegistry = islandRegistry;
    this.#buildCache = buildCache;
  }

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

  async render(
    // deno-lint-ignore no-explicit-any
    vnode: VNode<any> | null,
    init: ResponseInit | undefined = {},
  ): Promise<Response> {
    if (arguments.length === 0) {
      throw new Error(`No arguments passed to: ctx.render()`);
    } else if (vnode !== null && !isValidElement(vnode)) {
      throw new Error(`Non-JSX element passed to: ctx.render()`);
    }

    const defs = this.__internal.layouts;
    const appDef = this.__internal.app;
    const props = this as FreshReqContext<State>;

    // Compose final vnode tree
    for (let i = defs.length - 1; i >= 0; i--) {
      const child = vnode;
      props.Component = () => child;

      const def = defs[i];

      if (isAsyncAnyComponent(def.component)) {
        props.data = def.props;
        const result = await renderAsyncAnyComponent(def.component, props);
        if (result instanceof Response) {
          return result;
        }
        vnode = result;
      } else {
        const vnodeProps: PageProps<unknown, State> = {
          Component: props.Component,
          config: this.config,
          data: def.props,
          error: this.error,
          info: this.info,
          isPartial: this.isPartial,
          params: this.params,
          req: this.req,
          state: this.state,
          url: this.url,
        };
        vnode = h(def.component, vnodeProps) as VNode;
      }
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
        this.#islandRegistry,
        this.#buildCache,
        partialId,
      );

      try {
        setRenderState(state);

        return preactRender(
          vnode ?? h(Fragment, null),
          this,
          state,
          this.#buildCache,
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

  setAppWrapper(component: RouteComponent<State>) {
    this.__internal.app = component;
  }

  setLayout(component: RouteComponent<State>, config?: LayoutConfig) {
    if (config?.skipAppWrapper) {
      this.__internal.app = null;
    }

    const def = { component, props: null };
    if (config?.skipInheritedLayouts) {
      this.__internal.layouts = [def];
    } else {
      this.__internal.layouts.push(def);
    }
  }
}

Object.defineProperties(FreshReqContext.prototype, {
  config: { enumerable: true },
  url: { enumerable: true },
  req: { enumerable: true },
  params: { enumerable: true },
  state: { enumerable: true },
  data: { enumerable: true },
  error: { enumerable: true },
  next: { enumerable: true },
  info: { enumerable: true },
});

async function renderAsyncAnyComponent<Props>(
  fn: AsyncAnyComponent<Props>,
  props: RenderableProps<Props>,
) {
  return await tracer.startActiveSpan(
    "invoke async component",
    async (span) => {
      span.setAttribute("fresh.span_type", "fs_routes/async_component");
      try {
        const result = (await fn(props)) as VNode | Response;
        span.setAttribute(
          "fresh.component_response",
          result instanceof Response ? "http" : "jsx",
        );
        return result;
      } catch (err) {
        recordSpanError(span, err);
        throw err;
      } finally {
        span.end();
      }
    },
  );
}

function preactRender<State, Data>(
  vnode: VNode,
  ctx: PageProps<Data, State>,
  state: RenderState,
  buildCache: BuildCache,
  headers: Headers,
) {
  try {
    let res = renderToString(vnode);
    // We require a the full outer DOM structure so that browser put
    // comment markers in the right place in the DOM.
    if (!state.renderedHtmlBody) {
      let scripts = "";
      if (ctx.url.pathname !== ctx.config.basePath + DEV_ERROR_OVERLAY_URL) {
        scripts = renderToString(h(FreshScripts, null));
      }
      res = `<body>${res}${scripts}</body>`;
    }
    if (!state.renderedHtmlHead) {
      res = `<head><meta charset="utf-8"></head>${res}`;
    }
    if (!state.renderedHtmlTag) {
      res = `<html>${res}</html>`;
    }

    return `<!DOCTYPE html>${res}`;
  } finally {
    // Add preload headers
    const basePath = ctx.config.basePath;
    const runtimeUrl = `${basePath}/_fresh/js/${BUILD_ID}/fresh-runtime.js`;
    let link = `<${encodeURI(runtimeUrl)}>; rel="modulepreload"; as="script"`;
    state.islands.forEach((island) => {
      const chunk = buildCache.getIslandChunkName(island.name);
      if (chunk !== null) {
        link += `, <${
          encodeURI(`${basePath}${chunk}`)
        }>; rel="modulepreload"; as="script"`;
      }
    });

    if (link !== "") {
      headers.append("Link", link);
    }

    state.clear();
    setRenderState(null);
  }
}

export type PageProps<Data = unknown, T = unknown> =
  & Omit<
    FreshContext<T>,
    "next" | "render" | "redirect" | "__internal"
  >
  & { data: Data; Component: FunctionComponent };
