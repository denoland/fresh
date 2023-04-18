import type { ConnInfo } from "./deps.ts";

type HandlerContext<T = unknown> = T & ConnInfo;

export type Handler<T = unknown> = (
  req: Request,
  ctx: HandlerContext<T>,
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

// deno-lint-ignore ban-types
export type InternalRoute<T = {}> = {
  pattern: URLPattern;
  methods: { [K in KnownMethod]?: MatchHandler<T> };
  default?: MatchHandler<T>;
};

export interface RouterOptions<T> {
  otherHandler?: Handler<T>;
  errorHandler?: ErrorHandler<T>;
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

export function router<T = unknown>(
  routes: Routes<T>,
  { otherHandler, errorHandler, unknownMethodHandler }: RouterOptions<T> = {
    otherHandler: defaultOtherHandler,
    errorHandler: defaultErrorHandler,
    unknownMethodHandler: defaultUnknownMethodHandler,
  },
): Handler<T> {
  otherHandler ??= defaultOtherHandler;
  errorHandler ??= defaultErrorHandler;
  unknownMethodHandler ??= defaultUnknownMethodHandler;

  const internalRoutes: InternalRoute<T>[] = [];
  for (const [path, methods] of Object.entries(routes)) {
    const entry: InternalRoute<T> = {
      pattern: new URLPattern({ pathname: path }),
      methods: {},
      default: undefined,
    };

    for (const [method, handler] of Object.entries(methods)) {
      if (method === "default") {
        entry.default = handler;
      } else if (knownMethods.includes(method as KnownMethod)) {
        entry.methods[method as KnownMethod] = handler;
      }
    }

    internalRoutes.push(entry);
  }

  return async (req, ctx) => {
    try {
      for (const route of internalRoutes) {
        const res = route.pattern.exec(req.url);

        if (res !== null) {
          const groups = res?.pathname.groups ?? {};

          for (const key in groups) {
            groups[key] = decodeURIComponent(groups[key]);
          }

          for (const [method, handler] of Object.entries(route.methods)) {
            if (req.method === method) {
              return await handler(req, ctx, groups);
            }
          }

          if (route.default) {
            return await route.default(req, ctx, groups);
          } else {
            return await unknownMethodHandler!(
              req,
              ctx,
              Object.keys(route.methods) as KnownMethod[],
            );
          }
        }
      }

      return await otherHandler!(req, ctx);
    } catch (err) {
      return errorHandler!(req, ctx, err);
    }
  };
}

Deno.serve(router({ "/": {fvdbf: () => new Response("foo")}}))
