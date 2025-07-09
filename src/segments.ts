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
import { HttpError } from "./error.ts";

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
  finalized: MiddlewareFn<State>[];
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
  error404: InternalRoute<State> | null;
  error500: InternalRoute<State> | null;
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
    finalized: [],
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
    error404: null,
    error500: null,
    parent,
    children: new Map(),
  };
}

export function registerRoutes<State>(
  router: Router<InternalRoute<State>>,
  segment: Segment<State>,
  sPattern: string,
  stack: MiddlewareFn<State>[],
) {
  if (segment.pattern !== "" && !segment.pattern.startsWith("(_")) {
    sPattern += "/";
    sPattern += segment.pattern;
  }

  stack.push(async function prepareSegment(ctx) {
    const { layout, app, error: errorRoute, error404, error500 } = segment;

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
      } else if (err instanceof HttpError) {
        if (err.status >= 500) {
          if (error500 !== null) {
            return await renderInternalRoute(ctx, error500);
          }
        } else if (err.status === 404) {
          if (error404 !== null) {
            return await renderInternalRoute(ctx, error404);
          }
        }
      }

      throw err;
    }
  });

  if (segment.middlewares.length > 0) {
    stack.push(...segment.middlewares);
  }

  for (const route of segment.routes.values()) {
    route.finalized = stack.slice();
    route.finalized.push(function renderPage(ctx) {
      return renderInternalRoute(ctx, route);
    });

    let pattern = sPattern;
    if (route.pattern !== "_index") {
      pattern += "/" + route.pattern;
    } else if (sPattern === "") {
      pattern += "/";
    }

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
      router.add("OPTIONS", pattern, route);
    } else if (
      typeof route.handlers === "function" || route.component !== null
    ) {
      router.add("GET", pattern, route);
      router.add("POST", pattern, route);
      router.add("PATCH", pattern, route);
      router.add("PUT", pattern, route);
      router.add("DELETE", pattern, route);
      router.add("HEAD", pattern, route);
      router.add("OPTIONS", pattern, route);
    } else {
      if (route.middlewareHandlers.GET.length > 0) {
        router.add("GET", pattern, route);
      }
      if (route.middlewareHandlers.POST.length > 0) {
        router.add("POST", pattern, route);
      }
      if (route.middlewareHandlers.PATCH.length > 0) {
        router.add("PATCH", pattern, route);
      }
      if (route.middlewareHandlers.PUT.length > 0) {
        router.add("PUT", pattern, route);
      }
      if (route.middlewareHandlers.DELETE.length > 0) {
        router.add("DELETE", pattern, route);
      }
      if (route.middlewareHandlers.HEAD.length > 0) {
        router.add("HEAD", pattern, route);
      }
      router.add("OPTIONS", pattern, route);
    }
  }

  for (const child of segment.children.values()) {
    registerRoutes(router, child, sPattern, stack.slice());
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

export async function renderInternalRoute<State>(
  ctx: FreshContext<State>,
  route: InternalRoute<State>,
): Promise<Response> {
  if (route.config?.skipAppWrapper) {
    ctx.__internal.app = null;
  }
  if (route.config?.skipInheritedLayouts) {
    ctx.__internal.layouts = [];
  }

  // deno-lint-ignore no-explicit-any
  let props: any = null;

  const method = ctx.req.method as Method;

  const { handlers, middlewareHandlers } = route;

  if (middlewareHandlers[method].length > 0) {
    return await runMiddlewares(middlewareHandlers[method], ctx);
  }

  let status = 200;
  const headers = new Headers();
  headers.set("Content-Type", "text/html;charset=utf-8");

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

    if (typeof res.status === "number") {
      status = res.status;
    }
    if (res.headers) {
      for (const [name, value] of Object.entries(res.headers)) {
        headers.set(name, value);
      }
    }

    props = res.data;
  }

  if (route.component !== null) {
    ctx.__internal.layouts.push({
      props,
      component: route.component,
    });
  }

  console.log(ctx.__internal);
  console.log(ctx.url.pathname);

  return ctx.render(null, { headers, status });
}
