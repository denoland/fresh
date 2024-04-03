import type { FunctionComponent, VNode } from "preact";
import type { ResolvedFreshConfig } from "./config.ts";
import { renderToString } from "preact-render-to-string";
import type { BuildCache } from "./build_cache.ts";
import { RenderState, setRenderState } from "./runtime/server/preact_hooks.tsx";

const NOOP = () => null;

/**
 * The context passed to every middleware. It is unique for every request.
 */
export interface FreshContext<State = unknown, Data = unknown> {
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
   * Unstable parts of fresh
   */
  buildCache: BuildCache;
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

  /**
   * TODO: Remove this later
   * @deprecated Use {@link throw} instead
   */
  renderNotFound(): Promise<void>;
}

// deno-lint-ignore no-unused-vars
const RENDER_PREACT_SLOT = (idx: number) =>
  `<!--frsh:await:${idx}--><!--/frsh:await:${idx}-->`;

export class FreshReqContext<T> implements FreshContext<T, unknown> {
  url: URL;
  Component = NOOP;
  redirect = redirectTo;
  params = {} as Record<string, string>;
  state = {} as T;
  data = {} as unknown;
  error: Error | null = null;

  constructor(
    public req: Request,
    public config: ResolvedFreshConfig,
    public next: FreshContext<T>["next"],
    public buildCache: BuildCache,
  ) {
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

    // TODO: Add json renderer
    headers.set("Content-Type", "text/html; charset=utf-8");
    const responseInit: ResponseInit = { status: init.status ?? 200, headers };

    const result = preactRender(vnode, this);
    return new Response("<!DOCTYPE html>" + result, responseInit);
  }

  renderNotFound(): Promise<void> {
    return this.throw(404);
  }
}

function preactRender<T>(vnode: VNode, ctx: FreshContext<T>) {
  const state = new RenderState(ctx);
  setRenderState(state);
  try {
    // TODO: Streaming
    return renderToString(vnode);
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
