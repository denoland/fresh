import type { ComponentType, FunctionComponent, VNode } from "preact";
import type { ResolvedFreshConfig } from "./config.ts";
import { renderToString } from "preact-render-to-string";
import type { BuildCache } from "./build_cache.ts";
import { RenderState, setRenderState } from "./runtime/server/preact_hooks.tsx";

export interface Island {
  file: string | URL;
  name: string;
  exportName: string;
  fn: ComponentType;
}

export type ServerIslandRegistry = Map<ComponentType, Island>;

const NOOP = () => null;

/**
 * The context passed to every middleware. It is unique for every request.
 */
export interface FreshContext<Data, State> {
  readonly _internal: BuildCache;
  /** Reference to the resolved Fresh configuration */
  readonly config: ResolvedFreshConfig;
  state: State;
  data: Data;
  /** The original incoming `Request` object` */
  req: Request;
  /**
   * The request url parsed into an `URL` instance. This is typically used
   * to apply logic based on the pathname of the incoming url or when
   * certain search parameters are set.
   */
  url: URL;
  params: Record<string, string>;
  error: unknown;
  Component: FunctionComponent;
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
  throw(status: number, messageOrError?: string | Error): never;
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

export class FreshReqContext<State> implements FreshContext<unknown, State> {
  url: URL;
  Component = NOOP;
  redirect = redirectTo;
  params = {} as Record<string, string>;
  state = {} as State;
  data = {} as never;
  error: Error | null = null;
  #islandRegistry: ServerIslandRegistry;
  _internal: BuildCache;

  constructor(
    public req: Request,
    public config: ResolvedFreshConfig,
    public next: FreshContext<unknown, State>["next"],
    buildCache: BuildCache,
    islandRegistry: ServerIslandRegistry,
  ) {
    this.#islandRegistry = islandRegistry;
    this._internal = buildCache;
    this.url = new URL(req.url);
  }

  throw(
    status: number,
    messageOrError?: string | Error | undefined,
  ): never {
    if (messageOrError instanceof Error) {
      // deno-lint-ignore no-explicit-any
      (messageOrError as any).status = status;
      throw messageOrError;
    }
    throw { status, message: messageOrError };
  }

  render(
    // deno-lint-ignore no-explicit-any
    vnode: VNode<any>,
    init: ResponseInit | undefined = {},
  ): Response | Promise<Response> {
    const headers = init.headers !== undefined
      ? init.headers instanceof Headers
        ? init.headers
        : new Headers(init.headers)
      : new Headers();

    headers.set("Content-Type", "text/html; charset=utf-8");
    const responseInit: ResponseInit = { status: init.status ?? 200, headers };

    let partialId = "";
    if (this.url.searchParams.has("fresh-partial")) {
      partialId = crypto.randomUUID();
      headers.set("X-Fresh-Id", partialId);
    }

    const html = preactRender(
      vnode,
      this,
      this.#islandRegistry,
      this._internal,
      partialId,
    );
    return new Response(html, responseInit);
  }

  renderNotFound(): Promise<void> {
    return this.throw(404);
  }
}

function preactRender<State, Data>(
  vnode: VNode,
  ctx: FreshContext<Data, State>,
  islandRegistry: ServerIslandRegistry,
  buildCache: BuildCache,
  partialId: string,
) {
  const state = new RenderState(ctx, islandRegistry, buildCache, partialId);
  setRenderState(state);
  try {
    let res = renderToString(vnode);
    // We require a the full outer DOM structure so that browser put
    // comment markers in the right place in the DOM.
    if (!state.renderedHtmlBody) {
      res = `<body>${res}</body>`;
    }
    if (!state.renderedHtmlHead) {
      res = `<head><meta charset="utf-8"></head>${res}`;
    }
    if (!state.renderedHtmlTag) {
      res = `<html>${res}</html>`;
    }

    return `<!DOCTYPE html>${res}`;
  } finally {
    state.clear();
    setRenderState(null);
  }
}

export function redirectTo(pathOrUrl: string, status = 302): Response {
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
