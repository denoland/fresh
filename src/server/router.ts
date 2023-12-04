import { PARTIAL_SEARCH_PARAM } from "../constants.ts";
import { BaseRoute, FreshContext } from "./types.ts";
import { isIdentifierChar, isIdentifierStart } from "./init_safe_deps.ts";

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
  pattern: RegExp | string;
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

function skipRegex(input: string, idx: number): number {
  let open = 0;

  for (let i = idx; i < input.length; i++) {
    const char = input[i];
    if (char === "(" || char === "[") {
      open++;
    } else if (char === ")" || char === "]") {
      if (open-- === 0) {
        return i;
      }
    } else if (char === "\\") {
      i++;
    }

    idx = i;
  }

  return idx;
}

const enum Char {
  "(" = 40,
  ")" = 41,
  "*" = 42,
  "/" = 47,
  ":" = 58,
  "\\" = 92,
  "{" = 123,
  "}" = 125,
}

// URLPattern is slow because it always parses the URL first and then matches
// the pattern. Converting it to a regex is faster, see:
// https://github.com/denoland/deno/issues/19861
export function patternToRegExp(input: string): RegExp {
  let tmpPattern = "";
  let pattern = "^";

  let groupIdx = -1;

  for (let i = 0; i < input.length; i++) {
    let ch = input.charCodeAt(i);

    if (groupIdx !== -1) {
      if (ch === Char["{"]) {
        throw new SyntaxError(`Unexpected token "{"`);
      }
      if (ch === Char["}"]) {
        pattern = tmpPattern + "(?:" + pattern + ")";
        groupIdx = -1;
        continue;
      }
    }

    if (ch === Char["/"]) {
      if (pattern === "^") {
        pattern += "\\/?";
      } else {
        pattern += "\\/";
      }
    } else if (ch === Char[":"]) {
      const start = i + 1;
      ch = input.charCodeAt(++i);
      if (!isIdentifierStart(ch)) {
        throw new SyntaxError(`Invalid URL pattern: ${input}`);
      }
      ch = input.charCodeAt(++i);
      while (isIdentifierChar(ch)) {
        ch = input.charCodeAt(++i);
      }

      const name = input.slice(start, i);

      if (ch === Char["("]) {
        const end = skipRegex(input, i);
        pattern += `(?<${name}>${input.slice(i + 1, end)})`;
        i = end;
        continue;
      } else if (ch === Char["*"]) {
        pattern += `(?<${name}>.*?)`;
        continue;
      } else {
        pattern += `(?<${name}>[^/]+)`;
        i--;
      }
    } else if (ch === Char["*"]) {
      pattern += ".*?";
    } else if (ch === Char["{"]) {
      tmpPattern = pattern;
      pattern = "";
      groupIdx = i;
    } else {
      pattern += input[i];
    }
  }

  return new RegExp(pattern + "$", "u");
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
      : patternToRegExp(path);

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
  url: string,
) => RouteResult {
  const processedRoutes: Array<InternalRoute | null> = [];
  processRoutes(processedRoutes, internalRoutes, "internal");
  processRoutes(processedRoutes, staticRoutes, "static");
  processRoutes(processedRoutes, routes, "route");

  const statics = new Map<string, RouteResult>();

  return (url: string) => {
    const urlObject = new URL(url);
    const isPartial = urlObject.searchParams.has(PARTIAL_SEARCH_PARAM);
    const pathname = urlObject.pathname;

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

      const res = route.pattern.exec(pathname);

      if (res !== null) {
        const groups: Record<string, string> = {};
        const matched = res?.groups;

        for (const key in matched) {
          const value = matched[key];

          if (value !== undefined) {
            groups[key] = decodeURIComponent(value);
          }
        }
        return {
          route: route,
          params: groups,
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
