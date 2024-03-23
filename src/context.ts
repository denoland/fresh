import { FunctionComponent, VNode } from "preact";
import { ResolvedFreshConfig } from "./config.ts";
import { BuildCache } from "./build_cache.ts";
import { RenderState } from "./middlewares/render/render_state.ts";
import { renderToStringAsync } from "https://esm.sh/*preact-render-to-string@6.4.0";

const NOOP = () => null;

export interface FreshContext<State = unknown, Data = unknown> {
  readonly requestId: string;
  readonly config: ResolvedFreshConfig;
  buildCache: BuildCache | null;
  state: State;
  data: Data;
  req: Request;
  url: URL;
  params: Record<string, string>;
  error: unknown;
  Component: FunctionComponent;
  redirect(path: string, status?: number): Response;
  throw(status: number, messageOrError?: string | Error): never;
  next(): Promise<Response>;
  render(vnode: VNode, init?: ResponseInit): Promise<Response>;

  /**
   * TODO: Remove this later
   * @deprecated Use {@link throw} instead
   */
  renderNotFound(): Promise<void>;
}

export class FreshReqContext<T> implements FreshContext<T, unknown> {
  url: URL;
  Component = NOOP;
  requestId: string;
  redirect = redirectTo;
  params = {} as Record<string, string>;
  state = {} as T;
  data = {} as unknown;
  error: Error | null = null;
  buildCache: BuildCache | null = null;

  constructor(
    public req: Request,
    public config: ResolvedFreshConfig,
    public next: FreshContext<T>["next"],
  ) {
    this.requestId = crypto.randomUUID().replace(/-/g, "");
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

  async render(
    // deno-lint-ignore no-explicit-any
    vnode: VNode<any>,
    init: ResponseInit | undefined = {},
  ): Promise<Response> {
    const state = new RenderState(this);

    // FIXME: Streaming
    const html = await renderToStringAsync(vnode, { __fresh: state });

    const headers = init.headers !== undefined
      ? init.headers instanceof Headers
        ? init.headers
        : new Headers(init.headers)
      : new Headers();

    // TODO: Add json renderer
    headers.set("Content-Type", "text/html; charset=utf-8");
    return new Response(html, { status: init.status ?? 200, headers });
  }

  renderNotFound(): Promise<void> {
    return this.throw(404);
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
