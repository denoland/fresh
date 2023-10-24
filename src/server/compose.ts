import { ErrorHandler, FinalHandler, InternalRoute } from "./router.ts";
import {
  BaseRoute,
  MiddlewareHandlerContext,
  MiddlewareRoute,
  RouterState,
  ServeHandlerInfo,
} from "./types.ts";

export const ROOT_BASE_ROUTE = toBaseRoute("/");

export function toBaseRoute(input: string): BaseRoute {
  if (input.endsWith("_layout")) {
    input = input.slice(0, -"_layout".length);
  } else if (input.endsWith("_middleware")) {
    input = input.slice(0, -"_middleware".length);
  } else if (input.endsWith("index")) {
    input = input.slice(0, -"index".length);
  }

  if (input.endsWith("/")) {
    input = input.slice(0, -1);
  }

  const suffix = !input.startsWith("/") ? "/" : "";
  return (suffix + input) as BaseRoute;
}

export function selectSharedRoutes<T extends { baseRoute: BaseRoute }>(
  curBaseRoute: BaseRoute,
  items: T[],
): T[] {
  const selected: T[] = [];

  for (const item of items) {
    const { baseRoute } = item;
    const res = curBaseRoute === baseRoute ||
      curBaseRoute.startsWith(
        baseRoute.length > 1 ? baseRoute + "/" : baseRoute,
      );
    if (res) {
      selected.push(item);
    }
  }

  return selected;
}

/**
 * Identify which middlewares should be applied for a request,
 * chain them and return a handler response
 */
export function composeMiddlewares(
  middlewares: MiddlewareRoute[],
  errorHandler: ErrorHandler<RouterState>,
  paramsAndRoute: (
    url: string,
  ) => {
    route: InternalRoute<RouterState> | undefined;
    params: Record<string, string>;
  },
) {
  return (
    req: Request,
    connInfo: ServeHandlerInfo,
    inner: FinalHandler<RouterState>,
  ) => {
    const handlers: (() => Response | Promise<Response>)[] = [];
    const paramsAndRouteResult = paramsAndRoute(req.url);

    // identify middlewares to apply, if any.
    // middlewares should be already sorted from deepest to shallow layer
    const mws = selectSharedRoutes(
      paramsAndRouteResult.route?.baseRoute ?? ROOT_BASE_ROUTE,
      middlewares,
    );

    let state: Record<string, unknown> = {};
    const middlewareCtx: MiddlewareHandlerContext = {
      next() {
        const handler = handlers.shift()!;
        try {
          // As the `handler` can be either sync or async, depending on the user's code,
          // the current shape of our wrapper, that is `() => handler(req, middlewareCtx)`,
          // doesn't guarantee that all possible errors will be captured.
          // `Promise.resolve` accept the value that should be returned to the promise
          // chain, however, if that value is produced by the external function call,
          // the possible `Error`, will *not* be caught by any `.catch()` attached to that chain.
          // Because of that, we need to make sure that the produced value is pushed
          // through the pipeline only if function was called successfully, and handle
          // the error case manually, by returning the `Error` as rejected promise.
          return Promise.resolve(handler());
        } catch (e) {
          return Promise.reject(e);
        }
      },
      ...connInfo,
      get state() {
        return state;
      },
      set state(v) {
        state = v;
      },
      destination: "route",
      params: paramsAndRouteResult.params,
    };

    for (const { module } of mws) {
      if (module.handler instanceof Array) {
        for (const handler of module.handler) {
          handlers.push(() => handler(req, middlewareCtx));
        }
      } else {
        const handler = module.handler;
        handlers.push(() => handler(req, middlewareCtx));
      }
    }

    const ctx = {
      ...connInfo,
      get state() {
        return state;
      },
      set state(v) {
        state = v;
      },
    };
    const { destination, handler } = inner(
      req,
      ctx,
      paramsAndRouteResult.params,
      paramsAndRouteResult.route,
    );
    handlers.push(handler);
    middlewareCtx.destination = destination;
    return middlewareCtx.next().catch((e) => errorHandler(req, ctx, e));
  };
}
