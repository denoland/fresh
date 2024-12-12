import {
  type ComponentType,
  type FunctionComponent,
  h,
  isValidElement,
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
import { DEV_ERROR_OVERLAY_URL } from "./constants.ts";
import { BUILD_ID } from "./runtime/build_id.ts";
import { tracer } from "./otel.ts";

export interface Island {
  file: string | URL;
  name: string;
  exportName: string;
  fn: ComponentType;
}

export type ServerIslandRegistry = Map<ComponentType, Island>;

/**
 * The context passed to every middleware. It is unique for every request.
 */
export interface FreshContext<State = unknown> {
  /** Reference to the resolved Fresh configuration */
  readonly config: ResolvedFreshConfig;
  readonly state: State;
  /** The original incoming `Request` object` */
  readonly request: Request;
  /** @deprecated This is an alias for internal use only. Use {@linkcode FreshContext[request]} instead. */
  readonly req: Request;
  /**
   * The request url parsed into an `URL` instance. This is typically used
   * to apply logic based on the pathname of the incoming url or when
   * certain search parameters are set.
   */
  readonly url: URL;
  readonly params: Record<string, string>;
  readonly error: unknown;
  readonly info: Deno.ServeHandlerInfo;
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
  render(vnode: VNode, init?: ResponseInit): Response | Promise<Response>;
}

export let getBuildCache: (ctx: FreshContext<unknown>) => BuildCache;

export class FreshReqContext<State>
  implements FreshContext<State>, PageProps<unknown, State> {
  config: ResolvedFreshConfig;
  url: URL;
  request: Request;
  /** @deprecated This is an alias for internal use only. Use {@linkcode FreshReqContext[request]} instead. */
  req: Request;
  params: Record<string, string>;
  state: State = {} as State;
  data: unknown = undefined;
  error: unknown | null = null;
  info: Deno.ServeHandlerInfo | Deno.ServeHandlerInfo;

  next: FreshContext<State>["next"];

  #islandRegistry: ServerIslandRegistry;
  #buildCache: BuildCache;

  // FIXME: remove after switching to <Slot />
  Component!: FunctionComponent;

  static {
    getBuildCache = (ctx) => (ctx as FreshReqContext<unknown>).#buildCache;
  }

  constructor(
    request: Request,
    url: URL,
    info: Deno.ServeHandlerInfo,
    params: Record<string, string>,
    config: ResolvedFreshConfig,
    next: FreshContext<State>["next"],
    islandRegistry: ServerIslandRegistry,
    buildCache: BuildCache,
  ) {
    this.url = url;
    this.request = request;
    this.req = request;
    this.info = info;
    this.params = params;
    this.config = config;
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

  render(
    // deno-lint-ignore no-explicit-any
    vnode: VNode<any>,
    init: ResponseInit | undefined = {},
  ): Response | Promise<Response> {
    if (arguments.length === 0) {
      throw new Error(`No arguments passed to: ctx.render()`);
    } else if (vnode !== null && !isValidElement(vnode)) {
      throw new Error(`Non-JSX element passed to: ctx.render()`);
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
    if (this.url.searchParams.has("fresh-partial")) {
      partialId = crypto.randomUUID();
      headers.set("X-Fresh-Id", partialId);
    }

    const html = tracer.startActiveSpan("render", (span) => {
      span.setAttribute("fresh.span_type", "render");
      try {
        return preactRender(
          vnode,
          this,
          this.#islandRegistry,
          this.#buildCache,
          partialId,
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
        span.end();
      }
    });
    return new Response(html, responseInit);
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

function preactRender<State, Data>(
  vnode: VNode,
  ctx: PageProps<Data, State>,
  islandRegistry: ServerIslandRegistry,
  buildCache: BuildCache,
  partialId: string,
  headers: Headers,
) {
  const state = new RenderState(ctx, islandRegistry, buildCache, partialId);
  setRenderState(state);
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
  & Omit<FreshContext<T>, "next" | "render" | "redirect">
  & { data: Data; Component: FunctionComponent };
