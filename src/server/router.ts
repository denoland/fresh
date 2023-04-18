import type { ConnInfo } from "./deps.ts";
import { MiddlewareHandlerContext } from "./types.ts";

type HandlerContext<T = unknown> = T & ConnInfo;

export type Handler<T = unknown> = (
  req: Request,
  ctx: HandlerContext<T>,
) => Response | Promise<Response>;

export type FinalHandler<T = unknown> = (
  req: Request,
  ctx: MiddlewareHandlerContext<T>,
  handlers: (() => Response | Promise<Response>)[],
) => Response | Promise<Response>;

export type ErrorHandler<T = unknown> = (
  req: Request,
  ctx: HandlerContext<T>,
  err: unknown,
) => Response | Promise<Response>;

type UnknownMethodHandler<T = unknown> = (
  req: Request,
  ctx: HandlerContext<T>,
  knownMethods: KnownMethod[],
) => Response | Promise<Response>;

export type MatchHandler<T = unknown> = (
  req: Request,
  ctx: HandlerContext<T>,
  match: Record<string, string>,
) => Response | Promise<Response>;

// deno-lint-ignore ban-types
export interface Routes<T = {}> {
  [key: string]: { [K in KnownMethod | "default"]?: MatchHandler<T> };
}

export type RouteKinds = "internal" | "static" | "route" | "notFound" | "error";

// deno-lint-ignore ban-types
export type InternalRoute<T = {}> = {
  pattern: URLPattern;
  methods: { [K in KnownMethod]?: MatchHandler<T> };
  default?: MatchHandler<T>;
  kind: RouteKinds;
};

export interface RouterOptions<T> {
  internalRoutes: Routes<T>,
  staticRoutes: Routes<T>,
  routes: Routes<T>,
  otherHandler: Handler<T>;
  errorHandler: ErrorHandler<T>;
  unknownMethodHandler?: UnknownMethodHandler<T>;
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
  _ctx: HandlerContext,
  err: unknown,
): Response {
  console.error(err);

  return new Response(null, {
    status: 500,
  });
}

export function defaultUnknownMethodHandler(
  _req: Request,
  _ctx: HandlerContext,
  knownMethods: KnownMethod[],
): Response {
  return new Response(null, {
    status: 405,
    headers: {
      Accept: knownMethods.join(", "),
    },
  });
}

function processRoutes<T>(processedRoutes: InternalRoute<T>[], routes: Routes<T>, kind: RouteKinds) {
  for (const [path, methods] of Object.entries(routes)) {
    const entry: InternalRoute<T> = {
      pattern: new URLPattern({ pathname: path }),
      methods: {},
      default: undefined,
      kind,
    };

    for (const [method, handler] of Object.entries(methods)) {
      if (method === "default") {
        entry.default = handler;
      } else if (knownMethods.includes(method as KnownMethod)) {
        entry.methods[method as KnownMethod] = handler;
      }
    }

    processedRoutes.push(entry);
  }
}

export function router<T = unknown>(
  { internalRoutes,
    staticRoutes,
    routes, otherHandler, errorHandler, unknownMethodHandler }: RouterOptions<T>,
): FinalHandler<T> {
  unknownMethodHandler ??= defaultUnknownMethodHandler;

  const processedRoutes: InternalRoute<T>[] = [];
  processRoutes(processedRoutes, internalRoutes, "internal");
  processRoutes(processedRoutes, staticRoutes, "static");
  processRoutes(processedRoutes, routes, "route");

  return async (req, ctx, handlers) => {
    try {
      for (const route of processedRoutes) {
        const res = route.pattern.exec(req.url);

        if (res !== null) {
          ctx.routeKind = route.kind;
          const groups = res?.pathname.groups ?? {};

          for (const key in groups) {
            groups[key] = decodeURIComponent(groups[key]);
          }

          for (const [method, handler] of Object.entries(route.methods)) {
            if (req.method === method) {
              handlers.push(() => handler(req, ctx, groups));
              return await ctx.next();
            }
          }

          if (route.default) {
            handlers.push(() => route.default!(req, ctx, groups));
            return await ctx.next();
          } else {
            handlers.push(() => unknownMethodHandler!(
              req,
              ctx,
              Object.keys(route.methods) as KnownMethod[],
            ));
            return await ctx.next();
          }
        }
      }

      ctx.routeKind = "notFound";
      handlers.push(() => otherHandler!(req, ctx));
      return await ctx.next();
    } catch (err) {
      ctx.routeKind = "error";
      handlers.push(() => errorHandler!(req, ctx, err));
      return ctx.next();
    }
  };
}
