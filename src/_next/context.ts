export type EmptyObj = Record<string | number | symbol, never>;

export interface FreshContext<State = unknown> {
  state: State;
  req: Request;
  url: URL;
  params: Record<string, string>;
  redirect(path: string, status?: number): Response;
  next(): Promise<Response>;
}

export function createContext<T>(
  req: Request,
  next: FreshContext<T>["next"],
): FreshContext<T> {
  return {
    url: new URL(req.url),
    req,
    redirect: redirectTo,
    params: {},
    next,
    state: {} as T,
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
