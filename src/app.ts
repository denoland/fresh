import { trace } from "@opentelemetry/api";

import * as colors from "@std/fmt/colors";
import {
  type MaybeLazyMiddleware,
  type Middleware,
  runMiddlewares,
} from "./middlewares/mod.ts";
import { Context } from "./context.ts";
import { mergePath, type Method, UrlPatternRouter } from "./router.ts";
import type { FreshConfig, ResolvedFreshConfig } from "./config.ts";
import type { BuildCache } from "./build_cache.ts";
import { HttpError } from "./error.ts";
import type { LayoutConfig, MaybeLazy, Route, RouteConfig } from "./types.ts";
import type { RouteComponent } from "./segments.ts";
import {
  applyCommands,
  type Command,
  CommandType,
  DEFAULT_NOT_ALLOWED_METHOD,
  DEFAULT_NOT_FOUND,
  newAppCmd,
  newErrorCmd,
  newHandlerCmd,
  newLayoutCmd,
  newMiddlewareCmd,
  newNotFoundCmd,
  newRouteCmd,
} from "./commands.ts";
import { MockBuildCache } from "./test_utils.ts";
import { DENO_DEPLOYMENT_ID } from "fresh/build-id";

// TODO: Completed type clashes in older Deno versions
// deno-lint-ignore no-explicit-any
export const DEFAULT_CONN_INFO: any = {
  localAddr: { transport: "tcp", hostname: "localhost", port: 8080 },
  remoteAddr: { transport: "tcp", hostname: "localhost", port: 1234 },
};

const defaultOptionsHandler = (methods: string[]): () => Promise<Response> => {
  return () =>
    Promise.resolve(
      new Response(null, {
        status: 204,
        headers: { Allow: methods.join(", ") },
      }),
    );
};
// deno-lint-ignore require-await
const DEFAULT_ERROR_HANDLER = async <State>(ctx: Context<State>) => {
  const { error } = ctx;

  if (error instanceof HttpError) {
    if (error.status >= 500) {
      // deno-lint-ignore no-console
      console.error(error);
    }
    return new Response(error.message, { status: error.status });
  }

  // deno-lint-ignore no-console
  console.error(error);
  return new Response("Internal server error", { status: 500 });
};

export type ListenOptions =
  & Partial<
    Deno.ServeTcpOptions & Deno.TlsCertifiedKeyPem
  >
  & {
    remoteAddress?: string;
  };
function createOnListen(
  basePath: string,
  options: ListenOptions,
): (localAddr: Deno.NetAddr) => void {
  return (params) => {
    const pathname = basePath + "/";
    const protocol = "key" in options && options.key && options.cert
      ? "https:"
      : "http:";

    let hostname = params.hostname;
    // Windows being windows...
    if (
      Deno.build.os === "windows" &&
      (hostname === "0.0.0.0" || hostname === "::")
    ) {
      hostname = "localhost";
    }
    // Work around https://github.com/denoland/deno/issues/23650
    hostname = hostname.startsWith("::") ? `[${hostname}]` : hostname;

    // deno-lint-ignore no-console
    console.log();
    // deno-lint-ignore no-console
    console.log(
      colors.bgRgb8(colors.rgb8(" 🍋 Fresh ready   ", 0), 121),
    );
    const sep = options.remoteAddress ? "" : "\n";
    const space = options.remoteAddress ? " " : "";

    const localLabel = colors.bold("Local:");
    const address = colors.cyan(
      `${protocol}//${hostname}:${params.port}${pathname}`,
    );
    const helper = hostname === "0.0.0.0" || hostname === "::"
      ? colors.cyan(` (${protocol}//localhost:${params.port}${pathname})`)
      : "";
    // deno-lint-ignore no-console
    console.log(`    ${localLabel}  ${space}${address}${helper}${sep}`);
    if (options.remoteAddress) {
      const remoteLabel = colors.bold("Remote:");
      const remoteAddress = colors.cyan(options.remoteAddress);
      // deno-lint-ignore no-console
      console.log(`    ${remoteLabel}  ${remoteAddress}\n`);
    }
  };
}

async function listenOnFreePort(
  options: ListenOptions,
  handler: (
    request: Request,
    info?: Deno.ServeHandlerInfo,
  ) => Promise<Response>,
) {
  // No port specified, check for a free port. Instead of picking just
  // any port we'll check if the next one is free for UX reasons.
  // That way the user only needs to increment a number when running
  // multiple apps vs having to remember completely different ports.
  let firstError = null;
  for (let port = 8000; port < 8020; port++) {
    try {
      return await Deno.serve({ ...options, port }, handler);
    } catch (err) {
      if (err instanceof Deno.errors.AddrInUse) {
        // Throw first EADDRINUSE error if no port is free
        if (!firstError) firstError = err;
        continue;
      }
      throw err;
    }
  }
  throw firstError;
}

export let getBuildCache: <State>(app: App<State>) => BuildCache<State> | null;
export let setBuildCache: <State>(
  app: App<State>,
  cache: BuildCache<State>,
  mode: "development" | "production",
) => void;

/**
 * Create an application instance that passes the incoming `Request`
 * instance through middlewares and routes.
 */
export class App<State> {
  #getBuildCache: () => BuildCache<State> | null = () => null;
  #commands: Command<State>[] = [];

  static {
    getBuildCache = (app) => app.#getBuildCache();
    setBuildCache = (app, cache, mode: "development" | "production") => {
      app.config.root = cache.root;
      app.config.mode = mode;
      app.#getBuildCache = () => cache;
    };
  }

  /**
   * The final resolved Fresh configuration.
   */
  config: ResolvedFreshConfig;

  constructor(config: FreshConfig = {}) {
    this.config = {
      root: "",
      basePath: config.basePath ?? "",
      mode: config.mode ?? "production",
    };
  }

  /**
   * Add one or more middlewares at the top or the specified path.
   */
  use(...middleware: MaybeLazyMiddleware<State>[]): this;
  use(path: string, ...middleware: MaybeLazyMiddleware<State>[]): this;
  use(
    pathOrMiddleware: string | MaybeLazyMiddleware<State>,
    ...middlewares: MaybeLazyMiddleware<State>[]
  ): this {
    let pattern: string;
    let fns: MaybeLazyMiddleware<State>[];
    if (typeof pathOrMiddleware === "string") {
      pattern = pathOrMiddleware;
      fns = middlewares!;
    } else {
      pattern = "*";
      middlewares.unshift(pathOrMiddleware);
      fns = middlewares;
    }

    this.#commands.push(newMiddlewareCmd(pattern, fns, true));

    return this;
  }

  /**
   * Set the app's 404 error handler. Can be a {@linkcode Route} or a {@linkcode Middleware}.
   */
  notFound(routeOrMiddleware: Route<State> | Middleware<State>): this {
    this.#commands.push(newNotFoundCmd(routeOrMiddleware));
    return this;
  }

  onError(
    path: string,
    routeOrMiddleware: Route<State> | Middleware<State>,
  ): this {
    this.#commands.push(newErrorCmd(path, routeOrMiddleware, true));
    return this;
  }

  appWrapper(component: RouteComponent<State>): this {
    this.#commands.push(newAppCmd(component));
    return this;
  }

  layout(
    path: string,
    component: RouteComponent<State>,
    config?: LayoutConfig,
  ): this {
    this.#commands.push(newLayoutCmd(path, component, config, true));
    return this;
  }

  route(
    path: string,
    route: MaybeLazy<Route<State>>,
    config?: RouteConfig,
  ): this {
    this.#commands.push(newRouteCmd(path, route, config, false));
    return this;
  }

  /**
   * Add middlewares for GET requests at the specified path.
   */
  get(path: string, ...middlewares: MaybeLazy<Middleware<State>>[]): this {
    this.#commands.push(newHandlerCmd("GET", path, middlewares, false));
    return this;
  }
  /**
   * Add middlewares for POST requests at the specified path.
   */
  post(path: string, ...middlewares: MaybeLazy<Middleware<State>>[]): this {
    this.#commands.push(newHandlerCmd("POST", path, middlewares, false));
    return this;
  }
  /**
   * Add middlewares for PATCH requests at the specified path.
   */
  patch(path: string, ...middlewares: MaybeLazy<Middleware<State>>[]): this {
    this.#commands.push(newHandlerCmd("PATCH", path, middlewares, false));
    return this;
  }
  /**
   * Add middlewares for PUT requests at the specified path.
   */
  put(path: string, ...middlewares: MaybeLazy<Middleware<State>>[]): this {
    this.#commands.push(newHandlerCmd("PUT", path, middlewares, false));
    return this;
  }
  /**
   * Add middlewares for DELETE requests at the specified path.
   */
  delete(path: string, ...middlewares: MaybeLazy<Middleware<State>>[]): this {
    this.#commands.push(newHandlerCmd("DELETE", path, middlewares, false));
    return this;
  }
  /**
   * Add middlewares for HEAD requests at the specified path.
   */
  head(path: string, ...middlewares: MaybeLazy<Middleware<State>>[]): this {
    this.#commands.push(newHandlerCmd("HEAD", path, middlewares, false));
    return this;
  }

  /**
   * Add middlewares for all HTTP verbs at the specified path.
   */
  all(path: string, ...middlewares: MaybeLazy<Middleware<State>>[]): this {
    this.#commands.push(newHandlerCmd("ALL", path, middlewares, false));
    return this;
  }

  /**
   * Insert file routes collected in {@linkcode Builder} at this point.
   * @param pattern Append file routes at this pattern instead of the root
   * @returns
   */
  fsRoutes(pattern = "*"): this {
    this.#commands.push({
      type: CommandType.FsRoute,
      pattern,
      getItems: () => {
        const buildCache = this.#getBuildCache();
        if (buildCache === null) return [];
        return buildCache.getFsRoutes();
      },
      includeLastSegment: false,
    });
    return this;
  }

  /**
   * Merge another {@linkcode App} instance into this app at the
   * specified path.
   */
  mountApp(path: string, app: App<State>): this {
    for (let i = 0; i < app.#commands.length; i++) {
      const cmd = app.#commands[i];

      if (cmd.type !== CommandType.App && cmd.type !== CommandType.NotFound) {
        const clone = {
          ...cmd,
          pattern: mergePath(path, cmd.pattern),
          includeLastSegment: cmd.pattern === "/" || cmd.includeLastSegment,
        };
        this.#commands.push(clone);
        continue;
      }

      this.#commands.push(cmd);
    }

    // deno-lint-ignore no-this-alias
    const self = this;
    app.#getBuildCache = () => self.#getBuildCache();

    return this;
  }

  /**
   * Create handler function for `Deno.serve` or to be used in
   * testing.
   */
  handler(): (
    request: Request,
    info?: Deno.ServeHandlerInfo,
  ) => Promise<Response> {
    let buildCache = this.#getBuildCache();
    if (buildCache === null) {
      if (
        this.config.mode === "production" &&
        DENO_DEPLOYMENT_ID !== undefined
      ) {
        throw new Error(
          `Could not find _fresh directory. Maybe you forgot to run "deno task build"?`,
        );
      } else {
        buildCache = new MockBuildCache([], this.config.mode);
      }
    }

    const router = new UrlPatternRouter<MaybeLazyMiddleware<State>>();

    const { rootMiddlewares } = applyCommands(
      router,
      this.#commands,
      this.config.basePath,
    );

    return async (
      req: Request,
      conn: Deno.ServeHandlerInfo = DEFAULT_CONN_INFO,
    ) => {
      const url = new URL(req.url);
      // Prevent open redirect attacks
      url.pathname = url.pathname.replace(/\/+/g, "/");

      const method = req.method.toUpperCase() as Method;
      const matched = router.match(method, url);
      let { params, pattern, handlers, methodMatch } = matched;

      const span = trace.getActiveSpan();
      if (span && pattern) {
        span.updateName(`${method} ${pattern}`);
        span.setAttribute("http.route", pattern);
      }

      let next: () => Promise<Response>;

      if (pattern === null || !methodMatch) {
        handlers = rootMiddlewares;
      }

      if (matched.pattern !== null && !methodMatch) {
        if (method === "OPTIONS") {
          const allowed = router.getAllowedMethods(matched.pattern);
          next = defaultOptionsHandler(allowed);
        } else {
          next = DEFAULT_NOT_ALLOWED_METHOD;
        }
      } else {
        next = DEFAULT_NOT_FOUND;
      }

      const ctx = new Context<State>(
        req,
        url,
        conn,
        matched.pattern,
        params,
        this.config,
        next,
        buildCache!,
      );

      try {
        if (handlers.length === 0) return await next();

        const result = await runMiddlewares(handlers, ctx);
        if (!(result instanceof Response)) {
          throw new Error(
            `Expected a "Response" instance to be returned, but got: ${result}`,
          );
        }

        return result;
      } catch (err) {
        ctx.error = err;
        return await DEFAULT_ERROR_HANDLER(ctx);
      }
    };
  }

  /**
   * Spawn a server for this app.
   */
  async listen(options: ListenOptions = {}): Promise<void> {
    if (!options.onListen) {
      options.onListen = createOnListen(this.config.basePath, options);
    }

    const handler = this.handler();
    if (options.port) {
      await Deno.serve(options, handler);
      return;
    }

    await listenOnFreePort(options, handler);
  }
}
