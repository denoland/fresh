import { FunctionComponent } from "preact";
import { ResolvedFreshConfig } from "./config.ts";
import { BuildCache } from "./build_cache.ts";

export type EmptyObj = Record<string | number | symbol, never>;

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
  redirect(path: string, status?: number): Response;
  next(): Promise<Response>;
  throw(status: number, messageOrError?: string | Error): never;
  Component: FunctionComponent;

  /**
   * TODO: Remove this later
   * @deprecated Use {@link throw} instead
   */
  renderNotFound(): Promise<void>;
}

// TODO: Support cause?
// TODO: Should we always throw actual error objects? Stack traces are
//  expensive :S
function throwError(status: number, messageOrError?: string | Error): never {
  if (messageOrError instanceof Error) {
    // deno-lint-ignore no-explicit-any
    (messageOrError as any).status = status;
    throw messageOrError;
  }
  throw { status, message: messageOrError };
}

const NOOP = () => null;

export function createContext<T>(
  req: Request,
  config: ResolvedFreshConfig,
  next: FreshContext<T>["next"],
): FreshContext<T> {
  const requestId = crypto.randomUUID().replace(/-/g, "");

  return {
    requestId,
    config,
    url: new URL(req.url),
    req,
    buildCache: null,
    redirect: redirectTo,
    params: {},
    next,
    state: {} as T,
    data: {} as unknown,
    error: null,
    throw: throwError,
    Component: NOOP,
    renderNotFound() {
      return throwError(404);
    },
  };
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
