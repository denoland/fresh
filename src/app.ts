import { type ComponentType, h } from "preact";
import { renderToString } from "preact-render-to-string";
import { trace } from "@opentelemetry/api";

import { DENO_DEPLOYMENT_ID } from "./runtime/build_id.ts";
import * as colors from "@std/fmt/colors";
import { type MiddlewareFn, runMiddlewares } from "./middlewares/mod.ts";
import { FreshReqContext } from "./context.ts";
import { type Method, type Router, UrlPatternRouter } from "./router.ts";
import {
  type FreshConfig,
  normalizeConfig,
  type ResolvedFreshConfig,
} from "./config.ts";
import { type BuildCache, ProdBuildCache } from "./build_cache.ts";
import type { FreshContext, ServerIslandRegistry } from "./context.ts";
import { FinishSetup, ForgotBuild } from "./finish_setup.tsx";
import { HttpError } from "./error.ts";
import { pathToExportName } from "./utils.ts";
import {
  findOrCreateSegment,
  getOrCreateRoute,
  type InternalRoute,
  newRoute,
  newSegment,
  registerRoutes,
  type RouteComponent,
  routeToMiddlewares,
  type Segment,
} from "./segments.ts";
import type { FreshFsItem } from "./plugins/fs_routes/mod.ts";

// TODO: Completed type clashes in older Deno versions
// deno-lint-ignore no-explicit-any
export const DEFAULT_CONN_INFO: any = {
  localAddr: { transport: "tcp", hostname: "localhost", port: 8080 },
  remoteAddr: { transport: "tcp", hostname: "localhost", port: 1234 },
};

const DEFAULT_NOT_FOUND = (): Promise<Response> => {
  throw new HttpError(404);
};
const DEFAULT_NOT_ALLOWED_METHOD = (): Promise<Response> => {
  throw new HttpError(405);
};
// deno-lint-ignore require-await
const DEFAULT_ERROR_HANDLER = async <State>(ctx: FreshContext<State>) => {
  const { error } = ctx;

  console.log("GG", error);
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
    // Don't spam logs with this on live deployments
    if (DENO_DEPLOYMENT_ID) return;

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

// deno-lint-ignore no-explicit-any
export let getRouteTree: (app: App<any>) => Segment<any>;
// deno-lint-ignore no-explicit-any
export let getIslandRegistry: (app: App<any>) => ServerIslandRegistry;
// deno-lint-ignore no-explicit-any
export let getBuildCache: (app: App<any>) => BuildCache | null;
// deno-lint-ignore no-explicit-any
export let setBuildCache: (app: App<any>, cache: BuildCache | null) => void;

export class App<State> {
  #router: Router<InternalRoute<State>> = new UrlPatternRouter<
    InternalRoute<State>
  >();
  #root: Segment<State>;
  #islandRegistry: ServerIslandRegistry = new Map();
  #buildCache: BuildCache | null = null;
  #islandNames = new Set<string>();

  static {
    getRouteTree = (app) => app.#root;
    getIslandRegistry = (app) => app.#islandRegistry;
    getBuildCache = (app) => app.#buildCache;
    setBuildCache = (app, cache) => app.#buildCache = cache;
  }

  /**
   * The final resolved Fresh configuration.
   */
  config: ResolvedFreshConfig;

  constructor(config: FreshConfig = {}) {
    this.config = normalizeConfig(config);
    this.#root = newSegment("", null);
  }

  island(
    filePathOrUrl: string | URL,
    exportName: string,
    // deno-lint-ignore no-explicit-any
    fn: ComponentType<any>,
  ): this {
    const filePath = filePathOrUrl instanceof URL
      ? filePathOrUrl.href
      : filePathOrUrl;

    // Create unique island name
    let name = exportName === "default"
      ? pathToExportName(filePath)
      : exportName;
    if (this.#islandNames.has(name)) {
      let i = 0;
      while (this.#islandNames.has(`${name}_${i}`)) {
        i++;
      }
      name = `${name}_${i}`;
    }

    this.#islandRegistry.set(fn, { fn, exportName, name, file: filePathOrUrl });
    return this;
  }

  use(...middleware: MiddlewareFn<State>[]): this;
  use(path: string, ...middleware: MiddlewareFn<State>[]): this;
  use(
    pathOrMiddleware: string | MiddlewareFn<State>,
    ...middleware: MiddlewareFn<State>[]
  ): this {
    let pathname: string;
    let fns: MiddlewareFn<State>[];
    if (typeof pathOrMiddleware === "string") {
      pathname = pathOrMiddleware;
      fns = middleware!;
    } else {
      pathname = "";
      fns = [pathOrMiddleware, ...middleware];
    }

    const segment = findOrCreateSegment<State>(this.#root, pathname);
    segment.middlewares.push(...fns);

    return this;
  }

  appWrapper(fn: RouteComponent<State>): this {
    this.#root.app = fn;
    return this;
  }

  layout(
    path: string,
    layout: RouteComponent<State>,
    options: { skipInheritedLayouts?: boolean; skipAppWrapper?: boolean } = {},
  ): this {
    const segment = findOrCreateSegment<State>(this.#root, path);
    segment.layout = {
      component: layout,
      config: options,
    };
    return this;
  }

  error(
    path: string,
    errorRoute: FreshFsItem<State>,
  ): this {
    const segment = findOrCreateSegment<State>(this.#root, path);

    const route = newRoute(segment, "");
    assignRoute(route, errorRoute);
    segment.error = route;

    return this;
  }

  /**
   * @deprecated Use {@linkcode App.error} instead.
   */
  error404(errorRoute: FreshFsItem<State>) {
    const segment = this.#root;
    const route = newRoute(segment, "");
    assignRoute(route, errorRoute);
    segment.error404 = route;
  }

  /**
   * @deprecated Use {@linkcode App.error} instead.
   */
  error500(errorRoute: FreshFsItem<State>) {
    const segment = this.#root;
    const route = newRoute(segment, "");
    assignRoute(route, errorRoute);
    segment.error500 = route;
  }

  route(path: string, route: FreshFsItem<State>): this {
    const { route: sRoute } = getOrCreateRoute<State>(
      this.#root,
      path,
    );

    assignRoute(sRoute, route);

    return this;
  }

  get(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    this.#registerMiddleware("GET", path, middlewares);
    return this;
  }
  post(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    this.#registerMiddleware("POST", path, middlewares);
    return this;
  }
  patch(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    this.#registerMiddleware("PATCH", path, middlewares);
    return this;
  }
  put(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    this.#registerMiddleware("PUT", path, middlewares);
    return this;
  }
  delete(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    this.#registerMiddleware("DELETE", path, middlewares);
    return this;
  }
  head(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    this.#registerMiddleware("HEAD", path, middlewares);
    return this;
  }
  all(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    this.#registerMiddleware("DELETE", path, middlewares);
    this.#registerMiddleware("GET", path, middlewares);
    this.#registerMiddleware("HEAD", path, middlewares);
    this.#registerMiddleware("POST", path, middlewares);
    this.#registerMiddleware("PATCH", path, middlewares);
    this.#registerMiddleware("PUT", path, middlewares);

    return this;
  }

  #registerMiddleware(
    method: Method,
    path: string,
    middlewares: MiddlewareFn<State>[],
  ) {
    const routePath = this.config.basePath + path;
    const { route } = getOrCreateRoute<State>(this.#root, routePath);
    route.middlewareHandlers[method].push(...middlewares);
  }

  mountApp(path: string, app: App<State>): this {
    const segment = findOrCreateSegment(this.#root, path);

    const root = app.#root;
    if (root.app) segment.app = root.app;
    if (root.layout) segment.layout = root.layout;
    if (root.error) {
      root.error.parent = segment;
      segment.error = root.error;
    }
    if (root.middlewares.length > 0) {
      segment.middlewares.push(...root.middlewares);
    }
    if (root.children.size > 0) {
      root.children.forEach((value, key) => {
        const clone = { ...value };
        clone.parent = segment;
        segment.children.set(key, clone);
      });
    }
    if (root.routes.size > 0) {
      root.routes.forEach((value, key) => {
        const clone = { ...value };
        clone.parent = segment;
        segment.routes.set(key, clone);
      });
    }

    app.#islandRegistry.forEach((value, key) => {
      this.#islandRegistry.set(key, value);
    });

    return this;
  }

  /**
   * Create handler function for `Deno.serve` or to be used in
   * testing.
   * @param {() => Promise<Response>} [nextFn] overwrite default 404 handler
   * @returns {Deno.ServeHandler}
   */
  handler(nextFn?: () => Promise<Response>): (
    request: Request,
    info?: Deno.ServeHandlerInfo,
  ) => Promise<Response> {
    if (this.#buildCache === null) {
      this.#buildCache = ProdBuildCache.fromSnapshot(
        this.config,
        this.#islandRegistry.size,
      );
    }

    if (
      !this.#buildCache.hasSnapshot && this.config.mode === "production" &&
      DENO_DEPLOYMENT_ID !== undefined
    ) {
      return missingBuildHandler;
    }

    if (
      this.#root.error === null && this.#root.error404 === null &&
      this.#root.error500 === null
    ) {
      const route = newRoute(this.#root, "");
      route.handlers = DEFAULT_ERROR_HANDLER;
      this.#root.error = route;
    }

    registerRoutes(this.#router, this.#root, "");

    const error404Route = this.#root.error ?? this.#root.error404 ?? null;

    const notAllowedMethod = [DEFAULT_NOT_ALLOWED_METHOD];
    const notFound = [DEFAULT_NOT_FOUND];

    return async (
      req: Request,
      conn: Deno.ServeHandlerInfo = DEFAULT_CONN_INFO,
    ) => {
      const url = new URL(req.url);
      // Prevent open redirect attacks
      url.pathname = url.pathname.replace(/\/+/g, "/");

      const method = req.method.toUpperCase() as Method;
      const matched = this.#router.match(method, url);

      const next = matched.patternMatch && !matched.methodMatch
        ? DEFAULT_NOT_ALLOWED_METHOD
        : nextFn ?? DEFAULT_NOT_FOUND;

      const { params, pattern } = matched;
      const ctx = new FreshReqContext<State>(
        req,
        url,
        conn,
        params,
        this.config,
        next,
        this.#islandRegistry,
        this.#buildCache!,
      );

      const span = trace.getActiveSpan();
      if (span && pattern) {
        span.updateName(`${method} ${pattern}`);
        span.setAttribute("http.route", pattern);
      }

      let handlers: MiddlewareFn<State>[];
      if (matched.item === null) {
        if (matched.patternMatch && !matched.methodMatch) {
          ctx.error = new HttpError(405);
          handlers = notAllowedMethod;
        } else {
          ctx.error = new HttpError(404);
          handlers = error404Route !== null
            ? routeToMiddlewares<State>(error404Route)
            : notFound;
        }
      } else {
        handlers = routeToMiddlewares<State>(matched.item);
      }

      console.log({ handlers, url: url.pathname, method });
      console.log(matched);
      console.log(ctx.error);
      debugger;
      try {
        let result: unknown;
        if (handlers.length === 1) {
          result = await handlers[0](ctx);
        } else {
          result = await runMiddlewares(handlers, ctx);
        }
        if (!(result instanceof Response)) {
          throw new Error(
            `Expected a "Response" instance to be returned, but got: ${result}`,
          );
        }

        return result;
      } catch (err) {
        console.log("thrown");
        ctx.error = err;
        if (this.#root.error !== null) {
          const mids = routeToMiddlewares<State>(this.#root.error);
          return await runMiddlewares(mids, ctx);
        } else if (this.#root.error500 !== null) {
          const mids = routeToMiddlewares<State>(this.#root.error500);
          return await runMiddlewares(mids, ctx);
        }
        return DEFAULT_ERROR_HANDLER(ctx);
      }
    };
  }

  async listen(options: ListenOptions = {}): Promise<void> {
    if (!options.onListen) {
      options.onListen = createOnListen(this.config.basePath, options);
    }

    const handler = await this.handler();
    if (options.port) {
      await Deno.serve(options, handler);
      return;
    }

    await listenOnFreePort(options, handler);
  }
}

// deno-lint-ignore require-await
const missingBuildHandler = async (): Promise<Response> => {
  const headers = new Headers();
  headers.set("Content-Type", "text/html; charset=utf-8");

  const html = DENO_DEPLOYMENT_ID
    ? renderToString(h(FinishSetup, null))
    : renderToString(h(ForgotBuild, null));
  return new Response(html, { headers, status: 500 });
};

function assignRoute<State>(
  route: InternalRoute<State>,
  def: FreshFsItem<State>,
) {
  const handlers = def.handlers ?? def.handler ?? null;
  if (Array.isArray(handlers)) {
    throw new Error(`Route handlers cannot be an array`);
  }

  route.handlers = handlers;
  route.component = def.default ?? null;
  route.config = def.config ?? null;
}
