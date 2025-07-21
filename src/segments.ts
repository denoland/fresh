import type { AnyComponent } from "preact";
import type { MiddlewareFn } from "./middlewares/mod.ts";
import { type Method, patternToSegments } from "./router.ts";
import type { LayoutConfig, Route } from "./types.ts";
import { type Context, getInternals } from "./context.ts";
import { recordSpanError, tracer } from "./otel.ts";
import { isHandlerByMethod } from "./handlers.ts";
import {
  type AsyncAnyComponent,
  type PageProps,
  renderRouteComponent,
} from "./render.ts";
import { HttpError } from "./error.ts";

export type RouteComponent<State> =
  | AsyncAnyComponent<PageProps<unknown, State>>
  | AnyComponent<PageProps<unknown, State>>;

export interface Segment<State> {
  pattern: string;
  middlewares: MiddlewareFn<State>[];
  layout: {
    component: RouteComponent<State>;
    config: LayoutConfig | null;
  } | null;
  errorRoute: Route<State> | null;
  notFound: MiddlewareFn<State> | null;
  app: RouteComponent<State> | null;
  children: Map<string, Segment<State>>;
  parent: Segment<State> | null;
}

export function newSegment<State>(
  pattern: string,
  parent: Segment<State> | null,
): Segment<State> {
  return {
    pattern,
    middlewares: [],
    layout: null,
    app: null,
    errorRoute: null,
    notFound: null,
    parent,
    children: new Map(),
  };
}

export function getOrCreateSegment<State>(
  root: Segment<State>,
  path: string,
  includeLast: boolean,
): Segment<State> {
  let current = root;

  const segments = patternToSegments(path, root.pattern, includeLast);
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

export function segmentToMiddlewares<State>(
  segment: Segment<State>,
): MiddlewareFn<State>[] {
  const result: MiddlewareFn<State>[] = [];

  const stack: Segment<State>[] = [];
  let current: Segment<State> | null = segment;
  while (current !== null) {
    stack.push(current);
    current = current.parent;
  }

  const root = stack.at(-1)!;

  for (let i = stack.length - 1; i >= 0; i--) {
    const seg = stack[i];
    const { layout, app, errorRoute } = seg;

    result.push(async function segmentMiddleware(ctx) {
      const internals = getInternals(ctx);

      const prevApp = internals.app;
      const prevLayouts = internals.layouts;

      if (app !== null) {
        internals.app = app;
      }

      if (layout !== null) {
        if (layout.config?.skipAppWrapper) {
          internals.app = null;
        }

        const def = { props: null, component: layout.component };
        if (layout.config?.skipInheritedLayouts) {
          internals.layouts = [def];
        } else {
          internals.layouts = [...internals.layouts, def];
        }
      }

      try {
        return await ctx.next();
      } catch (err) {
        const status = err instanceof HttpError ? err.status : 500;
        if (root.notFound !== null && status === 404) {
          return await root.notFound(ctx);
        }

        if (errorRoute !== null) {
          return await renderRoute(ctx, errorRoute, status);
        }

        throw err;
      } finally {
        internals.app = prevApp;
        internals.layouts = prevLayouts;
      }
    });

    if (seg.middlewares.length > 0) {
      result.push(...seg.middlewares);
    }
  }

  return result;
}

export async function renderRoute<State>(
  ctx: Context<State>,
  route: Route<State>,
  status = 200,
): Promise<Response> {
  const internals = getInternals(ctx);
  if (route.config?.skipAppWrapper) {
    internals.app = null;
  }
  if (route.config?.skipInheritedLayouts) {
    internals.layouts = [];
  }

  const method = ctx.req.method as Method;

  const handlers = route.handler;
  if (handlers === undefined) {
    throw new Error(`Unexpected missing handlers`);
  }

  const headers = new Headers();
  headers.set("Content-Type", "text/html;charset=utf-8");

  const res = await tracer.startActiveSpan("handler", {
    attributes: { "fresh.span_type": "fs_routes/handler" },
  }, async (span) => {
    try {
      const fn = isHandlerByMethod(handlers)
        ? handlers[method] ?? null
        : handlers;

      if (fn === null) return await ctx.next();

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

  let vnode = null;
  if (route.component !== undefined) {
    const result = await renderRouteComponent(ctx, {
      component: route.component,
      // deno-lint-ignore no-explicit-any
      props: res.data as any,
    }, () => null);

    if (result instanceof Response) {
      return result;
    }

    vnode = result;
  }

  return ctx.render(vnode, { headers, status });
}
