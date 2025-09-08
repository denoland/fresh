import { setAdditionalStyles } from "./context.ts";
import { HttpError } from "./error.ts";
import { isHandlerByMethod, type PageResponse } from "./handlers.ts";
import type { MaybeLazyMiddleware, Middleware } from "./middlewares/mod.ts";
import { mergePath, type Method, type Router, toRoutePath } from "./router.ts";
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

export const enum CommandType {
  Middleware = "middleware",
  Layout = "layout",
  App = "app",
  Route = "route",
  Error = "error",
  NotFound = "notFound",
  Handler = "handler",
  FsRoute = "fsRoute",
}

export interface ErrorCmd<State> {
  type: CommandType.Error;
  pattern: string;
  item: Route<State>;
  includeLastSegment: boolean;
}
export function newErrorCmd<State>(
  pattern: string,
  routeOrMiddleware: Route<State> | Middleware<State>,
  includeLastSegment: boolean,
): ErrorCmd<State> {
  const route = typeof routeOrMiddleware === "function"
    ? { handler: routeOrMiddleware }
    : routeOrMiddleware;
  ensureHandler(route);

  return { type: CommandType.Error, pattern, item: route, includeLastSegment };
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
  component: RouteComponent<State>;
  config?: LayoutConfig;
  includeLastSegment: boolean;
}
export function newLayoutCmd<State>(
  pattern: string,
  component: RouteComponent<State>,
  config: LayoutConfig | undefined,
  includeLastSegment: boolean,
): LayoutCommand<State> {
  return {
    type: CommandType.Layout,
    pattern,
    component,
    config,
    includeLastSegment,
  };
}

export interface MiddlewareCmd<State> {
  type: CommandType.Middleware;
  pattern: string;
  fns: MaybeLazyMiddleware<State>[];
  includeLastSegment: boolean;
}
export function newMiddlewareCmd<State>(
  pattern: string,
  fns: MaybeLazyMiddleware<State>[],
  includeLastSegment: boolean,
): MiddlewareCmd<State> {
  return { type: CommandType.Middleware, pattern, fns, includeLastSegment };
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
  route: MaybeLazy<Route<State>>;
  config: RouteConfig | undefined;
  includeLastSegment: boolean;
}
export function newRouteCmd<State>(
  pattern: string,
  route: MaybeLazy<Route<State>>,
  config: RouteConfig | undefined,
  includeLastSegment: boolean,
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
    route: normalized,
    config,
    includeLastSegment,
  };
}

export interface HandlerCommand<State> {
  type: CommandType.Handler;
  pattern: string;
  method: Method | "ALL";
  fns: MaybeLazy<Middleware<State>>[];
  includeLastSegment: boolean;
}
export function newHandlerCmd<State>(
  method: Method | "ALL",
  pattern: string,
  fns: MaybeLazy<Middleware<State>>[],
  includeLastSegment: boolean,
): HandlerCommand<State> {
  return {
    type: CommandType.Handler,
    pattern,
    method,
    fns,
    includeLastSegment,
  };
}

export interface FsRouteCommand<State> {
  type: CommandType.FsRoute;
  pattern: string;
  getItems: () => Command<State>[];
  includeLastSegment: boolean;
}

export type Command<State> =
  | ErrorCmd<State>
  | AppCommand<State>
  | LayoutCommand<State>
  | NotFoundCmd<State>
  | MiddlewareCmd<State>
  | RouteCommand<State>
  | HandlerCommand<State>
  | FsRouteCommand<State>;

export function applyCommands<State>(
  router: Router<MaybeLazyMiddleware<State>>,
  commands: Command<State>[],
  basePath: string,
): { rootMiddlewares: MaybeLazyMiddleware<State>[] } {
  const root = newSegment<State>("", null);

  applyCommandsInner(root, router, commands, basePath);

  return { rootMiddlewares: segmentToMiddlewares(root) };
}

function applyCommandsInner<State>(
  root: Segment<State>,
  router: Router<MaybeLazyMiddleware<State>>,
  commands: Command<State>[],
  basePath: string,
) {
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];

    switch (cmd.type) {
      case CommandType.Middleware: {
        const segment = getOrCreateSegment(
          root,
          cmd.pattern,
          cmd.includeLastSegment,
        );
        segment.middlewares.push(...cmd.fns);
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
          cmd.includeLastSegment,
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
          cmd.includeLastSegment,
        );
        segment.layout = {
          component: cmd.component,
          config: cmd.config ?? null,
        };
        break;
      }
      case CommandType.Route: {
        const { pattern, route, config } = cmd;
        const segment = getOrCreateSegment(
          root,
          pattern,
          cmd.includeLastSegment,
        );
        const fns = segmentToMiddlewares(segment);

        if (isLazy(route)) {
          const routePath = mergePath(
            basePath,
            config?.routeOverride ?? pattern,
            false,
          );

          let def: Route<State>;
          fns.push(async (ctx) => {
            if (def === undefined) {
              def = await route();
            }

            if (def.css !== undefined) {
              setAdditionalStyles(ctx, def.css);
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

          const routePath = toRoutePath(mergePath(
            basePath,
            route.config?.routeOverride ?? pattern,
            false,
          ));

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
        const { pattern, fns, method } = cmd;
        const segment = getOrCreateSegment(
          root,
          pattern,
          cmd.includeLastSegment,
        );
        const result = segmentToMiddlewares(segment);

        result.push(...fns);

        const resPath = toRoutePath(mergePath(basePath, pattern, false));
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
        applyCommandsInner(root, router, items, basePath);
        break;
      }
      default:
        throw new Error(`Unknown command: ${JSON.stringify(cmd)}`);
    }
  }
}
