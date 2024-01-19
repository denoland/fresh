import { PARTIAL_SEARCH_PARAM } from "../constants.ts";
import { BaseRoute, FreshContext } from "./types.ts";

export type Handler<T = Record<string, unknown>> = (
  req: Request,
  ctx: FreshContext<T>,
) => Response | Promise<Response>;

export type FinalHandler = (
  req: Request,
  ctx: FreshContext,
  route?: InternalRoute,
) => {
  destination: DestinationKind;
  handler: () => Response | Promise<Response>;
};

export type ErrorHandler<T = Record<string, unknown>> = (
  req: Request,
  ctx: FreshContext<T>,
  err: unknown,
) => Response | Promise<Response>;

type UnknownMethodHandler = (
  req: Request,
  ctx: FreshContext,
  knownMethods: KnownMethod[],
) => Response | Promise<Response>;

export type MatchHandler = (
  req: Request,
  ctx: FreshContext,
) => Response | Promise<Response>;

export interface Routes {
  [key: string]: {
    baseRoute: BaseRoute;
    methods: {
      [K in KnownMethod | "default"]?: MatchHandler;
    };
  };
}

export type DestinationKind = "internal" | "static" | "route" | "notFound";

export type InternalRoute = {
  baseRoute: BaseRoute;
  originalPattern: string;
  pattern: URLPattern | string;
  methods: { [K in KnownMethod]?: MatchHandler };
  default?: MatchHandler;
  destination: DestinationKind;
};

export interface RouterOptions {
  internalRoutes: Routes;
  staticRoutes: Routes;
  routes: Routes;
  otherHandler: Handler;
  errorHandler: ErrorHandler;
  unknownMethodHandler?: UnknownMethodHandler;
}

export type KnownMethod = typeof knownMethods[number];

export const knownMethods = [
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "DELETE",
  "OPTIONS",
  "PATCH",
] as const;

export function defaultOtherHandler(_req: Request): Response {
  return new Response(null, {
    status: 404,
  });
}

export function defaultErrorHandler(
  _req: Request,
  ctx: FreshContext,
): Response {
  console.error(ctx.error);

  return new Response(null, {
    status: 500,
  });
}

export function defaultUnknownMethodHandler(
  _req: Request,
  _ctx: FreshContext,
  knownMethods: KnownMethod[],
): Response {
  return new Response(null, {
    status: 405,
    headers: {
      Accept: knownMethods.join(", "),
    },
  });
}

export const IS_PATTERN = /[*:{}+?()]/;

function processRoutes(
  processedRoutes: Array<InternalRoute | null>,
  routes: Routes,
  destination: DestinationKind,
) {
  for (const [path, def] of Object.entries(routes)) {
    const pattern = destination === "static" || !IS_PATTERN.test(path)
      ? path
      : new URLPattern({ pathname: path });

    const entry: InternalRoute = {
      baseRoute: def.baseRoute,
      pattern,
      originalPattern: path,
      methods: {},
      default: undefined,
      destination,
    };

    for (const [method, handler] of Object.entries(def.methods)) {
      if (method === "default") {
        entry.default = handler;
      } else if (knownMethods.includes(method as KnownMethod)) {
        entry.methods[method as KnownMethod] = handler;
      }
    }

    processedRoutes.push(entry);
  }
}

export interface RouteResult {
  route: InternalRoute | undefined;
  params: Record<string, string>;
  isPartial: boolean;
}

export function getParamsAndRoute(
  {
    internalRoutes,
    staticRoutes,
    routes,
  }: RouterOptions,
): (
  url: URL,
) => RouteResult {
  const processedRoutes: Array<InternalRoute | null> = [];
  processRoutes(processedRoutes, internalRoutes, "internal");
  processRoutes(processedRoutes, staticRoutes, "static");
  processRoutes(processedRoutes, routes, "route");

  const statics = new Map<string, RouteResult>();

  return (url: URL) => {
    const isPartial = url.searchParams.has(PARTIAL_SEARCH_PARAM);
    const pathname = url.pathname;

    const cached = statics.get(pathname);
    if (cached !== undefined) {
      cached.isPartial = isPartial;
      return cached;
    }

    for (let i = 0; i < processedRoutes.length; i++) {
      const route = processedRoutes[i];
      if (route === null) continue;

      // Static routes where the full pattern contains no dynamic
      // parts and must be an exact match. We use that for static
      // files.
      if (typeof route.pattern === "string") {
        if (route.pattern === pathname) {
          processedRoutes[i] = null;
          const res = { route: route, params: {}, isPartial };
          statics.set(route.pattern, res);
          return res;
        }

        continue;
      }

      const res = route.pattern.exec(url);

      if (res !== null) {
        return {
          route: route,
          params: res.pathname.groups,
          isPartial,
        };
      }
    }
    return {
      route: undefined,
      params: {},
      isPartial,
    };
  };
}

export function router(
  {
    otherHandler,
    unknownMethodHandler,
  }: RouterOptions,
): FinalHandler {
  unknownMethodHandler ??= defaultUnknownMethodHandler;

  return (req, ctx, route) => {
    if (route) {
      // If not overridden, HEAD requests should be handled as GET requests but without the body.
      if (req.method === "HEAD" && !route.methods["HEAD"]) {
        req = new Request(req.url, { method: "GET", headers: req.headers });
      }

      for (const [method, handler] of Object.entries(route.methods)) {
        if (req.method === method) {
          return {
            destination: route.destination,
            handler: () => handler(req, ctx),
          };
        }
      }

      if (route.default) {
        return {
          destination: route.destination,
          handler: () => route.default!(req, ctx),
        };
      } else {
        return {
          destination: route.destination,
          handler: () =>
            unknownMethodHandler!(
              req,
              ctx,
              Object.keys(route.methods) as KnownMethod[],
            ),
        };
      }
    }

    return {
      destination: "notFound",
      handler: () => otherHandler!(req, ctx),
    };
  };
}

export function withBase(src: string, base?: string) {
  if (base !== undefined && src.startsWith("/") && !src.startsWith(base)) {
    return base + src;
  }
  return src;
}
