import type { AnyComponent } from "preact";
import type { MiddlewareFn } from "./middlewares/mod.ts";
import { type Method, patternToSegments, type Router } from "./router.ts";
import type { RouteConfig } from "./types.ts";
import type { PageProps } from "./context.ts";

export type InternalHandler<State> = {
  [M in Method]: { route: InternalRoute<State>; fns: MiddlewareFn<State>[] };
};

export interface InternalRoute<State> {
  pattern: string;
  filePath: string | null;
  config: RouteConfig | null;
  handlers: InternalHandler<State> | null;
  component: AnyComponent<PageProps<unknown, State>> | null;
  parent: Segment<State>;
}

export interface Segment<State> {
  pattern: string;
  middlewares: MiddlewareFn<State>[];
  route: InternalRoute<State> | null;
  layout: InternalRoute<State> | null;
  error: InternalRoute<State> | null;
  app: InternalRoute<State> | null;
  children: Map<string, Segment<State>>;
  parent: Segment<State> | null;
}

export function newRoute<T>(
  parent: Segment<T>,
  pattern: string,
): InternalRoute<T> {
  return {
    parent,
    filePath: null,
    component: null,
    handlers: null,
    pattern,
    config: null,
  };
}

export function newSegment<State>(
  pattern: string,
  parent: Segment<State> | null,
): Segment<State> {
  return {
    pattern,
    middlewares: [],
    layout: null,
    route: null,
    app: null,
    error: null,
    parent,
    children: new Map(),
  };
}

export function registerRoutes<State>(
  router: Router<InternalRoute<State>>,
  segment: Segment<State>,
  pattern: string,
) {
  const { route } = segment;

  if (!segment.pattern.startsWith("(_")) {
    if (!segment.pattern.startsWith("/") && !pattern.endsWith("/")) {
      pattern += "/";
    }
    pattern += segment.pattern;
  }

  if (route !== null && route.handlers !== null) {
    if (route.handlers.GET.fns.length > 0) {
      router.add("GET", pattern, route);
    }
    if (route.handlers.POST.fns.length > 0) {
      router.add("POST", pattern, route);
    }
    if (route.handlers.PATCH.fns.length > 0) {
      router.add("PATCH", pattern, route);
    }
    if (route.handlers.PUT.fns.length > 0) {
      router.add("PUT", pattern, route);
    }
    if (route.handlers.DELETE.fns.length > 0) {
      router.add("DELETE", pattern, route);
    }
    if (route.handlers.HEAD.fns.length > 0) {
      router.add("HEAD", pattern, route);
    }
  }

  for (const child of segment.children.values()) {
    registerRoutes(router, child, pattern);
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

export function getOrCreateHandlers<State>(root: Segment<State>, path: string) {
  const segment = findOrCreateSegment<State>(root, path);
  if (segment.route === null) {
    segment.route = newRoute(segment, path);
  }

  let handlers = segment.route.handlers;
  if (handlers === null) {
    handlers = {
      GET: { route: segment.route, fns: [] },
      DELETE: { route: segment.route, fns: [] },
      HEAD: { route: segment.route, fns: [] },
      PATCH: { route: segment.route, fns: [] },
      POST: { route: segment.route, fns: [] },
      PUT: { route: segment.route, fns: [] },
    };
    segment.route.handlers = handlers;
  }

  return { segment, route: segment.route, handlers };
}

export function routeToMiddlewares<State>(
  route: InternalRoute<State>,
  method: Method,
): MiddlewareFn<State>[] {
  const stack: Segment<State>[] = [];
  let current: Segment<State> | null = route.parent;
  while (current !== null) {
    stack.push(current);
    current = current.parent;
  }

  const result: MiddlewareFn<State>[] = [];

  for (let i = 0; i < stack.length; i++) {
    const segment = stack[i];
    if (segment.middlewares.length > 0) {
      result.push(...segment.middlewares);
    }
  }

  if (route.handlers !== null) {
    const handler = route.handlers[method] ?? route.handlers.ALL ?? null;
    if (handler !== null) {
      result.push(...handler.fns);
    }
  }

  return result;
}
