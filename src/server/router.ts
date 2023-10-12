import {
  BaseRoute,
  ErrorHandlerContext,
  ServeHandlerInfo,
  StaticFileRouteState,
} from "./types.ts";
import { sendFile } from "./static_files.ts";

export type HandlerContext<T = unknown> = T & ServeHandlerInfo;

export type Handler<T = unknown> = (
  req: Request,
  ctx: HandlerContext<T>,
) => Response | Promise<Response>;

export type FinalHandler<T = unknown> = (
  req: Request,
  ctx: HandlerContext<T>,
  params: Record<string, string>,
  route?: InternalRoute<T>,
) => {
  destination: DestinationKind;
  handler: () => Response | Promise<Response>;
};

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
  [key: string]: {
    baseRoute: BaseRoute;
    methods: {
      [K in KnownMethod | "default"]?: MatchHandler<T>;
    };
  };
}

export type DestinationKind = "internal" | "static" | "route" | "notFound";

// deno-lint-ignore ban-types
export type InternalRoute<T = {}> = {
  baseRoute: BaseRoute;
  pattern: URLPattern;
  methods: { [K in KnownMethod]?: MatchHandler<T> };
  default?: MatchHandler<T>;
  destination: DestinationKind;
};

export interface RouterOptions<T> {
  internalRoutes: Routes<T>;
  staticRouteState: StaticFileRouteState;
  routes: Routes<T>;
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
  _ctx: ErrorHandlerContext,
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

function processRoutes<T>(
  processedRoutes: InternalRoute<T>[],
  routes: Routes<T>,
  destination: DestinationKind,
) {
  for (const [path, def] of Object.entries(routes)) {
    const entry: InternalRoute<T> = {
      baseRoute: def.baseRoute,
      pattern: new URLPattern({ pathname: path }),
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

function checkIfRouteMatches<T>(
  route: InternalRoute<T>,
  url: string,
): { route: InternalRoute<T>; params: Record<string, string> } | undefined {
  const res = route.pattern.exec(url);
  if (res !== null) {
    const groups: Record<string, string> = {};
    const matched = res?.pathname.groups;

    for (const key in matched) {
      const value = matched[key];

      if (value !== undefined) {
        groups[key] = decodeURIComponent(value);
      }
    }
    return { route: route, params: groups };
  }
}

const stubPattern = new URLPattern("*", "https://localhost");

export function getParamsAndRoute<T>(
  {
    internalRoutes,
    staticRouteState,
    routes,
  }: RouterOptions<T>,
): (
  url: string,
) => { route: InternalRoute<T> | undefined; params: Record<string, string> } {
  const processedInternalRoutes: InternalRoute<T>[] = [];
  processRoutes(processedInternalRoutes, internalRoutes, "internal");

  const staticFilePaths = new Map(
    staticRouteState.files.map((file) => [file.path, file]),
  );
  // processRoutes(processedInternalRoutes, staticRoutes, "static");

  const processedRoutes: InternalRoute<T>[] = [];
  processRoutes(processedRoutes, routes, "route");

  return (url: string) => {
    // Check internal routes
    for (let i = 0; i < processedInternalRoutes.length; i++) {
      const route = processedInternalRoutes[i];
      const res = checkIfRouteMatches(route, url);
      if (res) return res;
    }

    // Check static files
    const parsedUrl = new URL(url);
    const staticFile = staticFilePaths.get(parsedUrl.pathname);
    if (staticFile !== undefined) {
      console.log("static", parsedUrl.pathname);
      return {
        params: {},
        route: {
          baseRoute: staticFile.baseRoute,
          destination: "static",
          get pattern() {
            console.trace("checking pattern");
            return stubPattern;
          },
          methods: {
            async HEAD(req) {
              const r = await sendFile(
                req,
                parsedUrl,
                staticRouteState,
                staticFile,
              );

              console.log(r.status);

              return r;
            },
            async GET(req) {
              const r = await sendFile(
                req,
                parsedUrl,
                staticRouteState,
                staticFile,
              );
              console.log(r.status);
              return r;
            },
          },
        },
      };
    }

    // Check project routes
    for (let i = 0; i < processedRoutes.length; i++) {
      const route = processedRoutes[i];
      const res = checkIfRouteMatches(route, url);
      if (res) return res;
    }

    return {
      route: undefined,
      params: {},
    };
  };
}

export function router<T = unknown>(
  {
    otherHandler,
    unknownMethodHandler,
  }: RouterOptions<T>,
): FinalHandler<T> {
  unknownMethodHandler ??= defaultUnknownMethodHandler;

  return (req, ctx, groups, route) => {
    if (route) {
      const res = route.pattern.exec(req.url);

      if (res !== null) {
        // If not overridden, HEAD requests should be handled as GET requests but without the body.
        if (req.method === "HEAD" && !route.methods["HEAD"]) {
          req = new Request(req.url, { method: "GET", headers: req.headers });
        }

        for (const [method, handler] of Object.entries(route.methods)) {
          if (req.method === method) {
            return {
              destination: route.destination,
              handler: () => handler(req, ctx, groups),
            };
          }
        }

        if (route.default) {
          return {
            destination: route.destination,
            handler: () => route.default!(req, ctx, groups),
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
    }

    return {
      destination: "notFound",
      handler: () => otherHandler!(req, ctx),
    };
  };
}
