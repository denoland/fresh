import type { AnyComponent } from "preact";
import { type MiddlewareFn, runMiddlewares } from "./middlewares/mod.ts";
import { type Method, patternToSegments, type Router } from "./router.ts";
import type { RouteConfig } from "./types.ts";
import type { FreshContext, PageProps } from "./context.ts";
import { recordSpanError, tracer } from "./otel.ts";
import {
  type HandlerFn,
  isHandlerByMethod,
  type RouteHandler,
} from "./handlers.ts";
import type { AsyncAnyComponent } from "./plugins/fs_routes/render_middleware.ts";

export type RouteComponent<State> =
  | AsyncAnyComponent<PageProps<unknown, State>>
  | AnyComponent<PageProps<unknown, State>>;

export interface InternalRoute<State> {
  pattern: string;
  filePath: string | null;
  config: RouteConfig | null;
  handlers: RouteHandler<unknown, State> | HandlerFn<unknown, State> | null;
  middlewareHandlers: { [M in Method]: MiddlewareFn<State>[] };
  component: RouteComponent<State> | null;
  parent: Segment<State>;
}

export interface Segment<State> {
  pattern: string;
  middlewares: MiddlewareFn<State>[];
  routes: Map<string, InternalRoute<State>>;
  layout: {
    component: RouteComponent<State>;
    config: Pick<RouteConfig, "skipAppWrapper" | "skipInheritedLayouts">;
  } | null;
  error: InternalRoute<State> | null;
  app: RouteComponent<State> | null;
  children: Map<string, Segment<State>>;
  parent: Segment<State> | null;
}

export function newRoute<T>(
  parent: Segment<T>,
  pattern: string,
): InternalRoute<T> {
  const route: InternalRoute<T> = {
    parent,
    filePath: null,
    component: null,
    handlers: null,
    middlewareHandlers: {
      GET: [],
      DELETE: [],
      HEAD: [],
      PATCH: [],
      POST: [],
      PUT: [],
    },
    pattern,
    config: null,
  };

  return route;
}

export function newSegment<State>(
  pattern: string,
  parent: Segment<State> | null,
): Segment<State> {
  return {
    pattern,
    middlewares: [],
    layout: null,
    routes: new Map(),
    app: null,
    error: null,
    parent,
    children: new Map(),
  };
}

export function registerRoutes<State>(
  router: Router<InternalRoute<State>>,
  segment: Segment<State>,
  sPattern: string,
) {
  if (segment.pattern !== "" && !segment.pattern.startsWith("(_")) {
    sPattern += "/";
    sPattern += segment.pattern;
  }

  for (const route of segment.routes.values()) {
    let pattern = sPattern;
    if (route.pattern !== "_index") {
      pattern += "/" + route.pattern;
    }
    console.log({ pattern, r: route.pattern, s: sPattern });

    if (isHandlerByMethod(route.handlers)) {
      if (route.handlers.GET !== undefined) {
        router.add("GET", pattern, route);
      }
      if (route.handlers.POST !== undefined) {
        router.add("POST", pattern, route);
      }
      if (route.handlers.PATCH !== undefined) {
        router.add("PATCH", pattern, route);
      }
      if (route.handlers.PUT !== undefined) {
        router.add("PUT", pattern, route);
      }
      if (route.handlers.DELETE !== undefined) {
        router.add("DELETE", pattern, route);
      }
      if (route.handlers.HEAD !== undefined) {
        router.add("HEAD", pattern, route);
      }
    } else if (
      typeof route.handlers === "function" || route.component !== null
    ) {
      router.add("GET", pattern, route);
      router.add("POST", pattern, route);
      router.add("PATCH", pattern, route);
      router.add("PUT", pattern, route);
      router.add("DELETE", pattern, route);
      router.add("HEAD", pattern, route);
    } else {
      if (route.middlewareHandlers.GET !== undefined) {
        router.add("GET", pattern, route);
      }
      if (route.middlewareHandlers.POST !== undefined) {
        router.add("POST", pattern, route);
      }
      if (route.middlewareHandlers.PATCH !== undefined) {
        router.add("PATCH", pattern, route);
      }
      if (route.middlewareHandlers.PUT !== undefined) {
        router.add("PUT", pattern, route);
      }
      if (route.middlewareHandlers.DELETE !== undefined) {
        router.add("DELETE", pattern, route);
      }
      if (route.middlewareHandlers.HEAD !== undefined) {
        router.add("HEAD", pattern, route);
      }
    }
  }

  for (const child of segment.children.values()) {
    registerRoutes(router, child, sPattern);
  }
}

export function findOrCreateSegment<State>(
  root: Segment<State>,
  path: string,
): Segment<State> {
  let current = root;

  const segments = patternToSegments(path, root.pattern);
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg === root.pattern) {
      current = root;
    } else {
      let child = current.children.get(seg);
      if (child === undefined) {
        child = newSegment(seg, current);
        current.children.set(seg, child);
      }

      current = child;
    }
  }

  return current;
}

export function getOrCreateRoute<State>(root: Segment<State>, path: string) {
  let routePath = "";
  let segmentPath = "";
  if (path.endsWith("/")) {
    routePath = "_index";
    segmentPath = path.slice(0, -1);
  } else {
    const idx = path.lastIndexOf("/");
    if (idx === -1) throw new Error(`Invalid route path: ${path}`);
    routePath = path.slice(idx + 1);
    segmentPath = path.slice(0, idx);
  }

  const segment = findOrCreateSegment<State>(root, segmentPath);
  let route = segment.routes.get(routePath);
  if (route === undefined) {
    route = newRoute(segment, routePath);
    segment.routes.set(routePath, route);
  }

  return { segment, route };
}

export function routeToMiddlewares<State>(
  route: InternalRoute<State>,
): MiddlewareFn<State>[] {
  const stack: Segment<State>[] = [];
  let current: Segment<State> | null = route.parent;
  while (current !== null) {
    stack.push(current);
    current = current.parent;
  }

  const result: MiddlewareFn<State>[] = [];

  for (let i = stack.length - 1; i >= 0; i--) {
    const segment = stack[i];

    const { layout, app, error: errorRoute } = segment;

    if (layout !== null || app !== null || errorRoute !== null) {
      result.push(async (ctx) => {
        const internal = ctx.__internal;
        if (app !== null) {
          internal.app = app;
        }

        if (layout !== null) {
          if (layout.config?.skipAppWrapper) {
            internal.app = null;
          }
          if (layout.config?.skipInheritedLayouts) {
            internal.layouts = [];
          }

          if (layout.component !== null) {
            internal.layouts.push({
              props: null,
              component: layout.component,
            });
          }
        }

        const prevApp = internal.app;
        const prevLayouts = internal.layouts;

        try {
          return await ctx.next();
        } catch (err) {
          ctx.error = err;

          internal.app = prevApp;
          internal.layouts = prevLayouts;

          if (errorRoute !== null) {
            return await renderInternalRoute(ctx, errorRoute);
          }

          throw err;
        }
      });
    }

    if (segment.middlewares.length > 0) {
      result.push(...segment.middlewares);
    }
  }

  if (route.handlers !== null || route.component !== null) {
    result.push((ctx) => renderInternalRoute(ctx, route));
  }

  return result;
}

export async function renderInternalRoute<State>(
  ctx: FreshContext<State>,
  route: InternalRoute<State>,
): Promise<Response> {
  // deno-lint-ignore no-explicit-any
  let props: any = null;

  const method = ctx.req.method as Method;

  const { handlers, middlewareHandlers } = route;

  if (middlewareHandlers[method].length > 0) {
    return await runMiddlewares(middlewareHandlers[method], ctx);
  }

  if (handlers !== null) {
    const res = await tracer.startActiveSpan("handler", {
      attributes: { "fresh.span_type": "fs_routes/handler" },
    }, async (span) => {
      try {
        const fn = isHandlerByMethod(handlers)
          ? handlers[method] ?? null
          : handlers;

        if (fn === null) return ctx.next();

        return await fn(ctx);
      } catch (err) {
        recordSpanError(span, err);
        throw err;
      } finally {
        span.end();
      }
    });

    if (res instanceof Response) {
      return res;
    }

    props = res;
  }

  if (route.component !== null) {
    ctx.__internal.layouts.push({
      props,
      component: route.component,
    });
  }

  return ctx.render(null);
}
