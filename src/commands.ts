import { HttpError } from "./error.ts";
import { isHandlerByMethod, type PageResponse } from "./handlers.ts";
import type { MaybeLazyMiddleware, Middleware } from "./middlewares/mod.ts";
import { mergePath, type Method, type Router } from "./router.ts";
import {
  getOrCreateSegment,
  newSegment,
  renderRoute,
  type RouteComponent,
  type Segment,
  segmentToMiddlewares,
} from "./segments.ts";
import type { LayoutConfig, MaybeLazy, Route, RouteConfig } from "./types.ts";
import { isLazy } from "./utils.ts";

export const DEFAULT_NOT_FOUND = (): Promise<Response> => {
  throw new HttpError(404);
};
export const DEFAULT_NOT_ALLOWED_METHOD = (): Promise<Response> => {
  throw new HttpError(405);
};

const DEFAULT_RENDER = <State>(): Promise<PageResponse<State>> =>
  // deno-lint-ignore no-explicit-any
  Promise.resolve({ data: {} as any });

function ensureHandler<State>(route: Route<State>) {
  if (route.handler === undefined) {
    route.handler = route.component !== undefined
      ? DEFAULT_RENDER
      : DEFAULT_NOT_FOUND;
  } else if (isHandlerByMethod(route.handler)) {
    if (route.component !== undefined && !route.handler.GET) {
      route.handler.GET = DEFAULT_RENDER;
    }
  }
}

let appCounter = 0;
export function getAppSegmentName() {
  return `/<App_${appCounter++}>`;
}

export const enum CommandType {
  Middleware = "middleware",
  Layout = "layout",
  App = "app",
  Route = "route",
  Error = "error",
  NotFound = "notFound",
  Handler = "handler",
  FsRoute = "fsRoute",
  Mount = "group",
}

export interface ErrorCmd<State> {
  type: CommandType.Error;
  pattern: string;
  routeOverride: string | null;
  item: Route<State>;
}
export function newErrorCmd<State>(
  pattern: string,
  routeOrMiddleware: Route<State> | Middleware<State>,
): ErrorCmd<State> {
  const route = typeof routeOrMiddleware === "function"
    ? { handler: routeOrMiddleware }
    : routeOrMiddleware;
  ensureHandler(route);

  return {
    type: CommandType.Error,
    pattern,
    routeOverride: null,
    item: route,
  };
}

export interface AppCommand<State> {
  type: CommandType.App;
  component: RouteComponent<State>;
}
export function newAppCmd<State>(
  component: RouteComponent<State>,
): AppCommand<State> {
  return { type: CommandType.App, component };
}

export interface LayoutCommand<State> {
  type: CommandType.Layout;
  pattern: string;
  routeOverride: string | null;
  component: RouteComponent<State>;
  config?: LayoutConfig;
}
export function newLayoutCmd<State>(
  pattern: string,
  component: RouteComponent<State>,
  config: LayoutConfig | undefined,
): LayoutCommand<State> {
  return {
    type: CommandType.Layout,
    pattern,
    routeOverride: null,
    component,
    config,
  };
}

export interface MiddlewareCmd<State> {
  type: CommandType.Middleware;
  pattern: string;
  routeOverride: string | null;
  fns: MaybeLazyMiddleware<State>[];
}
export function newMiddlewareCmd<State>(
  pattern: string,
  fns: MaybeLazyMiddleware<State>[],
): MiddlewareCmd<State> {
  return {
    type: CommandType.Middleware,
    pattern,
    routeOverride: null,
    fns,
  };
}

export interface NotFoundCmd<State> {
  type: CommandType.NotFound;
  fn: Middleware<State>;
}
export function newNotFoundCmd<State>(
  routeOrMiddleware: Route<State> | Middleware<State>,
): NotFoundCmd<State> {
  const route = typeof routeOrMiddleware === "function"
    ? { handler: routeOrMiddleware }
    : routeOrMiddleware;
  ensureHandler(route);

  return { type: CommandType.NotFound, fn: (ctx) => renderRoute(ctx, route) };
}

export interface RouteCommand<State> {
  type: CommandType.Route;
  pattern: string;
  routeOverride: string | null;
  route: MaybeLazy<Route<State>>;
  config: RouteConfig | undefined;
}
export function newRouteCmd<State>(
  pattern: string,
  routeOverride: string,
  route: MaybeLazy<Route<State>>,
  config: RouteConfig | undefined,
): RouteCommand<State> {
  let normalized;
  if (isLazy(route)) {
    normalized = async () => {
      const result = await route();
      ensureHandler(result);
      return result;
    };
  } else {
    ensureHandler(route);
    normalized = route;
  }

  return {
    type: CommandType.Route,
    pattern,
    routeOverride: config?.routeOverride ?? routeOverride ?? null,
    route: normalized,
    config,
  };
}

export interface HandlerCommand<State> {
  type: CommandType.Handler;
  pattern: string;
  method: Method | "ALL";
  routeOverride: string | null;
  fns: MaybeLazy<Middleware<State>>[];
}
export function newHandlerCmd<State>(
  method: Method | "ALL",
  pattern: string,
  routeOverride: string,
  fns: MaybeLazy<Middleware<State>>[],
): HandlerCommand<State> {
  return {
    type: CommandType.Handler,
    pattern,
    routeOverride,
    method,
    fns,
  };
}

export interface MountCommand<State> {
  type: CommandType.Mount;
  pattern: string;
  routeOverride: string | null;
  items: Command<State>[];
}
export function newMountCmd<State>(
  pattern: string,
  routeOverride: string,
  items: Command<State>[],
): MountCommand<State> {
  return {
    type: CommandType.Mount,
    pattern,
    routeOverride,
    items,
  };
}

export interface FsRouteCommand<State> {
  type: CommandType.FsRoute;
  pattern: string;
  routeOverride: string | null;
  getItems: () => Command<State>[];
}

export type Command<State> =
  | ErrorCmd<State>
  | AppCommand<State>
  | LayoutCommand<State>
  | NotFoundCmd<State>
  | MiddlewareCmd<State>
  | RouteCommand<State>
  | HandlerCommand<State>
  | FsRouteCommand<State>
  | MountCommand<State>;

export function applyCommands<State>(
  router: Router<MaybeLazyMiddleware<State>>,
  commands: Command<State>[],
  basePath: string,
): { rootMiddlewares: MaybeLazyMiddleware<State>[] } {
  const root = newSegment<State>("<root>", null);

  const rootMounted: MaybeLazyMiddleware<State>[] = [];
  applyCommandsInner(root, router, commands, rootMounted, basePath);

  const rootMiddlewares = segmentToMiddlewares(root);
  rootMiddlewares.push(...rootMounted);

  return { rootMiddlewares };
}

function applyCommandsInner<State>(
  root: Segment<State>,
  router: Router<MaybeLazyMiddleware<State>>,
  commands: Command<State>[],
  rootMounted: MaybeLazyMiddleware<State>[],
  basePath: string,
) {
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];

    switch (cmd.type) {
      case CommandType.Middleware: {
        const segment = getOrCreateSegment(
          root,
          cmd.pattern,
        );
        segment.middlewares.push(...cmd.fns);
        addRootIfMounted(segment, rootMounted, cmd.fns);
        break;
      }
      case CommandType.NotFound: {
        root.notFound = cmd.fn;
        break;
      }
      case CommandType.Error: {
        const segment = getOrCreateSegment(
          root,
          cmd.pattern,
        );
        segment.errorRoute = cmd.item;
        break;
      }
      case CommandType.App: {
        root.app = cmd.component;
        break;
      }
      case CommandType.Layout: {
        const segment = getOrCreateSegment(
          root,
          cmd.pattern,
        );
        segment.layout = {
          component: cmd.component,
          config: cmd.config ?? null,
        };
        break;
      }
      case CommandType.Route: {
        const { pattern, routeOverride, route, config } = cmd;
        const segment = getOrCreateSegment(
          root,
          pattern,
        );
        const fns = segmentToMiddlewares(segment);

        if (isLazy(route)) {
          const routePath = mergePath(basePath, routeOverride ?? pattern);

          let def: Route<State>;
          fns.push(async (ctx) => {
            if (def === undefined) {
              def = await route();
            }

            return renderRoute(ctx, def);
          });

          if (config === undefined || config.methods === "ALL") {
            router.add("GET", routePath, fns);
            router.add("DELETE", routePath, fns);
            router.add("HEAD", routePath, fns);
            router.add("OPTIONS", routePath, fns);
            router.add("PATCH", routePath, fns);
            router.add("POST", routePath, fns);
            router.add("PUT", routePath, fns);
          } else if (Array.isArray(config.methods)) {
            for (let i = 0; i < config.methods.length; i++) {
              const method = config.methods[i];
              router.add(method, routePath, fns);
            }
          }
        } else {
          fns.push((ctx) => renderRoute(ctx, route));

          const routePath = mergePath(basePath, routeOverride ?? pattern);

          if (typeof route.handler === "function") {
            router.add("GET", routePath, fns);
            router.add("DELETE", routePath, fns);
            router.add("HEAD", routePath, fns);
            router.add("OPTIONS", routePath, fns);
            router.add("PATCH", routePath, fns);
            router.add("POST", routePath, fns);
            router.add("PUT", routePath, fns);
          } else if (isHandlerByMethod(route.handler!)) {
            for (const method of Object.keys(route.handler)) {
              router.add(method as Method, routePath, fns);
            }
          }
        }
        break;
      }
      case CommandType.Handler: {
        const { pattern, routeOverride, fns, method } = cmd;
        const segment = getOrCreateSegment(
          root,
          pattern,
        );
        const result = segmentToMiddlewares(segment);

        result.push(...fns);

        const resPath = mergePath(basePath, routeOverride ?? pattern);
        if (method === "ALL") {
          router.add("GET", resPath, result);
          router.add("DELETE", resPath, result);
          router.add("HEAD", resPath, result);
          router.add("OPTIONS", resPath, result);
          router.add("PATCH", resPath, result);
          router.add("POST", resPath, result);
          router.add("PUT", resPath, result);
        } else {
          router.add(method, resPath, result);
        }

        break;
      }
      case CommandType.FsRoute: {
        const items = cmd.getItems();
        applyCommandsInner(root, router, items, rootMounted, basePath);
        break;
      }
      case CommandType.Mount: {
        const { items } = cmd;
        applyCommandsInner(root, router, items, rootMounted, basePath);
        break;
      }
      default:
        throw new Error(`Unknown command: ${JSON.stringify(cmd)}`);
    }
  }
}

export function addRootIfMounted<State>(
  segment: Segment<State>,
  rootMiddlewares: MaybeLazyMiddleware<State>[],
  middlewares: MaybeLazyMiddleware<State>[],
) {
  if (
    segment.parent?.pattern === "<root>" &&
    segment.pattern.startsWith("<App_")
  ) {
    rootMiddlewares.push(...middlewares);
  }
}
