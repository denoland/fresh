import type { AnyComponent } from "preact";
import type { RouteHandler } from "./handlers.ts";
import type { MiddlewareFn } from "./middlewares/mod.ts";
import type { Method } from "./router.ts";
import type { RouteConfig } from "./types.ts";
import type { PageProps } from "./context.ts";
import type { FreshFsItem } from "./plugins/fs_routes/mod.ts";

export interface InternalRoute<State> {
  pattern: string;
  filePath: string | null;
  config: RouteConfig | null;
  handlers:
    | RouteHandler<unknown, State>[]
    | RouteHandler<unknown, State>
    | null;
  component: AnyComponent<PageProps<unknown, State>> | null;
  parent: RouteDir<State>;
}

export interface RouteDir<State> {
  pattern: string;
  middlewares: MiddlewareFn<State>[];
  route: InternalRoute<State> | null;
  layout: any | null;
  error: any | null;
  app: any | null;
  children: Map<string, RouteDir<State>>;
  parent: RouteDir<State> | null;
}

export class AppRouter<State> implements RouterState<State> {
  root: RouterState<State>["root"] = newRouteDir("", null);
  cache: RouterState<State>["cache"] = new Map();
  statics: RouterState<State>["statics"] = new Map();
  dynamics: RouterState<State>["dynamics"] = [];
  routes: InternalRoute<State>[] = [];

  layout(path: string, fn: any): this {
    const seg = findOrCreateSegment(this, path);
    seg.layout = fn;
    return this;
  }

  use(path: string, fn: MiddlewareFn<State>): this {
    const seg = findOrCreateSegment(this, path);
    seg.middlewares.push(fn);
    return this;
  }

  error(path: string, fn: any): this {
    const seg = findOrCreateSegment(this, path);
    seg.error = fn;
    return this;
  }

  app(path: string, fn: any): this {
    const seg = findOrCreateSegment(this, path);
    seg.app = fn;
    return this;
  }

  route(path: string, route: FreshFsItem<State>): this {
    const seg = findOrCreateSegment(this, path);
    seg.route = {
      parent: seg,
      filePath: null,
      component: null,
      handlers: null,
      pattern: path,
      config: null,
    };
    this.routes.push({
      component: route.default ?? null,
      config: route.config ?? null,
      filePath: null,
      handlers: route.handlers ?? route.handler ?? null,
      parent: seg,
      pattern: path,
    });
    return this;
  }

  finalize() {
    console.log(this.root);
    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];
      finalizeRoute(this, route);
    }
  }

  match(method: Method, url: URL): RouteMatch<State> {
    const params = Object.create(null);

    // Check static routes first
    const match = this.statics.get(url.pathname);
    if (match !== undefined) {
      return createMatch(method, match.route, match.finalized, params);
    }

    for (let i = 0; i < this.dynamics.length; i++) {
      const { route, pattern, finalized } = this.dynamics[i];
      const match = pattern.exec(url.pathname);
      if (match === null) continue;

      // Decode matched params
      if (match.groups !== undefined) {
        for (const [key, value] of Object.entries(match.groups)) {
          params[key] = value === undefined ? "" : decodeURI(value);
        }
      }

      return createMatch(method, route, finalized, params);
    }

    return createMatch(method, null, null, params);
  }
}

function createMatch<State>(
  method: Method,
  route: InternalRoute<State> | null,
  fn: MiddlewareFn<State> | null,
  params: Record<string, string>,
): RouteMatch<State> {
  const result: RouteMatch<State> = {
    params,
    pattern: null,
    methodMatch: false,
    patternMatch: false,
    fn,
  };

  if (route !== null) {
    result.methodMatch = isMethodMatch(route, method);
    result.patternMatch = true;
  }

  return result;
}

export interface RouterState<State> {
  root: RouteDir<State>;
  cache: Map<string, RouteDir<State>>;
  statics: Map<
    string,
    { finalized: MiddlewareFn<State>; route: InternalRoute<State> }
  >;
  dynamics: Array<
    {
      pattern: RegExp;
      route: InternalRoute<State>;
      finalized: MiddlewareFn<State>;
    }
  >;
}

function newRouteDir<State>(
  pattern: string,
  parent: RouteDir<State> | null,
): RouteDir<State> {
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

export function pathToSegments(path: string): string[] {
  const out: string[] = [""];

  if (path === "/") return out;

  let start = -1;
  for (let i = 0; i < path.length; i++) {
    const ch = path[i];

    if (ch === "/") {
      if (i > 0) {
        const raw = path.slice(start + 1, i);
        out.push(raw);
      }
      start = i;
    }
  }

  if (start > -1) {
    const raw = path.slice(start + 1);
    out.push(raw);
  }

  return out;
}

export function findOrCreateSegment<State>(
  router: RouterState<State>,
  path: string,
): RouteDir<State> {
  let current = router.root;

  // Fast path
  if (path === "" || path === "/") {
    return current;
  }
  const cached = router.cache.get(path);
  if (cached !== undefined) {
    return cached;
  }

  const segments = pathToSegments(path);
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg === "") {
      current = router.root;
    } else {
      let child = current.children.get(seg);
      if (child === undefined) {
        child = newRouteDir(seg, current);
        current.children.set(seg, child);
      }

      current = child;
    }
  }

  router.cache.set(path, current);

  return current;
}

export const IS_PATTERN = /[*:{}+?()]/;
export function patternToRegex(pattern: string): RegExp {
  let s = "";

  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];

    if (ch === ":") {
      i++;
      const start = i;

      for (; i < pattern.length; i++) {
        const next = pattern[i];
        if (next === "-" || next === "(" || next === "/") {
          i--;
          break;
        }
      }

      const name = pattern.slice(start, i + 1);
      s += `(?<${name}>)`;
    } else if (ch === "(") {
      i++;
      const start = i;
      for (; i < pattern.length; i++) {
        const next = pattern[i];
        if (next === ")") {
          i--;
          break;
        }
      }

      const reg = pattern.slice(start, i + 1);
      i++;
      s += `(${reg})`;
    } else {
      s += ch;
    }
  }

  return new RegExp(s);
}

function finalizeRoute<State>(
  router: RouterState<State>,
  route: InternalRoute<State>,
) {
  let pattern = "";

  let current: InternalRoute<State> | RouteDir<State> | null = route;
  while (current !== null) {
    if (current.pattern !== "/") {
      pattern = "/" + current.pattern + pattern;
    }
    current = current.parent;
  }

  console.log("final", pattern);

  const finalized = null as any; // FIXME

  if (IS_PATTERN.test(pattern)) {
    router.statics.set(pattern, { route, finalized });
  } else {
    const reg = patternToRegex(pattern);
    router.dynamics.push({ pattern: reg, route, finalized });
  }
}

export interface RouteMatch<State> {
  fn: MiddlewareFn<State> | null;
  patternMatch: boolean;
  methodMatch: boolean;
  pattern: string | null;
  params: Record<string, string>;
}

function isMethodMatch<State>(
  route: InternalRoute<State>,
  method: Method,
): boolean {
  return route.handlers !== null &&
    (typeof route.handlers === "function" || Array.isArray(route.handlers) ||
      typeof route.handlers === "object" && method in route.handlers);
}
