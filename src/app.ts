import { type ComponentType, h } from "preact";
import { renderToString } from "preact-render-to-string";
import { trace } from "@opentelemetry/api";

import { DENO_DEPLOYMENT_ID } from "./runtime/build_id.ts";
import * as colors from "@std/fmt/colors";
import { type MiddlewareFn, runMiddlewares } from "./middlewares/mod.ts";
import { Context, type ServerIslandRegistry } from "./context.ts";
import {
  mergePath,
  type Method,
  type Router,
  UrlPatternRouter,
} from "./router.ts";
import {
  type FreshConfig,
  normalizeConfig,
  type ResolvedFreshConfig,
} from "./config.ts";
import { type BuildCache, ProdBuildCache } from "./build_cache.ts";
import { FinishSetup, ForgotBuild } from "./finish_setup.tsx";
import { HttpError } from "./error.ts";
import { pathToExportName } from "./utils.ts";
import type { LayoutConfig, Route } from "./types.ts";
import {
  getOrCreateSegment,
  newSegment,
  renderRoute,
  type RouteComponent,
  segmentToMiddlewares,
} from "./segments.ts";
import { isHandlerByMethod, type PageResponse } from "./handlers.ts";
import { staticFiles } from "./middlewares/static_files.ts";

// TODO: Completed type clashes in older Deno versions
// deno-lint-ignore no-explicit-any
export const DEFAULT_CONN_INFO: any = {
  localAddr: { transport: "tcp", hostname: "localhost", port: 8080 },
  remoteAddr: { transport: "tcp", hostname: "localhost", port: 1234 },
};

/** Used to group mounted apps. Only internal */
let INTERNAL_ID = 0;

const DEFAULT_RENDER = <State>(): Promise<PageResponse<State>> =>
  // deno-lint-ignore no-explicit-any
  Promise.resolve({ data: {} as any });

const DEFAULT_NOT_FOUND = (): Promise<Response> => {
  throw new HttpError(404);
};
const DEFAULT_NOT_ALLOWED_METHOD = (): Promise<Response> => {
  throw new HttpError(405);
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
export let getIslandRegistry: (app: App<any>) => ServerIslandRegistry;
// deno-lint-ignore no-explicit-any
export let getBuildCache: (app: App<any>) => BuildCache | null;
// deno-lint-ignore no-explicit-any
export let setBuildCache: (app: App<any>, cache: BuildCache | null) => void;

export class App<State> {
  #router: Router<MiddlewareFn<State>> = new UrlPatternRouter<
    MiddlewareFn<State>
  >();
  #islandRegistry: ServerIslandRegistry = new Map();
  #buildCache: BuildCache | null = null;
  #islandNames = new Set<string>();
  #root = newSegment<State>("", null);
  #routeDefs: {
    method: Method | "ALL";
    pattern: string;
    fns: MiddlewareFn<State>[];
    unshift: boolean;
  }[] = [];

  static {
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
    ...middlewares: MiddlewareFn<State>[]
  ): this {
    let path: string;
    let fns: MiddlewareFn<State>[];
    if (typeof pathOrMiddleware === "string") {
      path = pathOrMiddleware;
      fns = middlewares!;
    } else {
      path = "*";
      middlewares.unshift(pathOrMiddleware);
      fns = middlewares;
    }

    const segment = getOrCreateSegment(this.#root, path, false);
    segment.middlewares.push(...fns);

    return this;
  }

  notFound(routeOrMiddleware: Route<State> | MiddlewareFn<State>): this {
    const route = typeof routeOrMiddleware === "function"
      ? { handler: routeOrMiddleware }
      : routeOrMiddleware;
    ensureHandler(route);
    this.#root.notFound = (ctx) => renderRoute(ctx, route);

    return this;
  }

  onError(
    path: string,
    routeOrMiddleware: Route<State> | MiddlewareFn<State>,
  ): this {
    const segment = getOrCreateSegment(this.#root, path, true);
    segment.errorRoute = typeof routeOrMiddleware === "function"
      ? { handler: routeOrMiddleware }
      : routeOrMiddleware;

    ensureHandler(segment.errorRoute);

    return this;
  }

  appWrapper(component: RouteComponent<State>) {
    const segment = getOrCreateSegment<State>(this.#root, "", false);
    segment.app = component;
  }

  layout(
    path: string,
    component: RouteComponent<State>,
    config?: LayoutConfig,
  ): this {
    const segment = getOrCreateSegment<State>(this.#root, path, true);
    segment.layout = { component, config: config ?? null };

    return this;
  }

  route(path: string, route: Route<State>): this {
    const segment = getOrCreateSegment<State>(this.#root, path, false);
    const middlewares = segmentToMiddlewares(segment);

    ensureHandler(route);
    middlewares.push((ctx) => renderRoute(ctx, route));

    const routePath = route.config?.routeOverride ?? path;

    if (typeof route.handler === "function") {
      this.#addRoute("ALL", routePath, middlewares);
    } else if (isHandlerByMethod(route.handler!)) {
      for (const method of Object.keys(route.handler)) {
        this.#addRoute(method as Method, routePath, middlewares);
      }
    }

    return this;
  }

  get(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    this.#addMiddleware("GET", path, middlewares);
    return this;
  }
  post(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    this.#addMiddleware("POST", path, middlewares);
    return this;
  }
  patch(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    this.#addMiddleware("PATCH", path, middlewares);
    return this;
  }
  put(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    this.#addMiddleware("PUT", path, middlewares);
    return this;
  }
  delete(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    this.#addMiddleware("DELETE", path, middlewares);
    return this;
  }
  head(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    this.#addMiddleware("HEAD", path, middlewares);
    return this;
  }

  all(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    this.#addMiddleware("ALL", path, middlewares);
    return this;
  }

  #addMiddleware(
    method: Method | "ALL",
    path: string,
    fns: MiddlewareFn<State>[],
    unshift = false,
  ) {
    const segment = getOrCreateSegment<State>(this.#root, path, false);
    const result = segmentToMiddlewares(segment);

    result.push(...fns);

    const resPath = mergePath(this.config.basePath, path);
    this.#addRoute(method, resPath, result, unshift);
  }

  #addRoute(
    method: Method | "ALL",
    path: string,
    fns: MiddlewareFn<State>[],
    unshift = false,
  ) {
    this.#routeDefs.push({ method, pattern: path, fns, unshift });
  }

  mountApp(path: string, app: App<State>): this {
    const segmentPath = mergePath(path, `/__${INTERNAL_ID++}/`);
    const segment = getOrCreateSegment(this.#root, segmentPath, true);
    const fns = segmentToMiddlewares(segment);

    const routes = app.#routeDefs;
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];

      const merged = mergePath(path, route.pattern);
      const mergedFns = [...fns, ...route.fns];
      this.#addRoute(route.method, merged, mergedFns, route.unshift);
    }

    app.#islandRegistry.forEach((value, key) => {
      this.#islandRegistry.set(key, value);
    });

    app.#root.notFound = this.#root.notFound;

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

    // Fallthrough
    this.#addMiddleware(
      "ALL",
      "*",
      [...this.#root.middlewares, staticFiles()],
      true,
    );

    for (let i = 0; i < this.#routeDefs.length; i++) {
      const route = this.#routeDefs[i];
      this.#router.add(route.method, route.pattern, route.fns, route.unshift);
    }

    const rootMiddlewares = this.#root.middlewares;

    return async (
      req: Request,
      conn: Deno.ServeHandlerInfo = DEFAULT_CONN_INFO,
    ) => {
      const url = new URL(req.url);
      // Prevent open redirect attacks
      url.pathname = url.pathname.replace(/\/+/g, "/");

      const method = req.method.toUpperCase() as Method;
      const matched = this.#router.match(method, url);
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
          const allowed = this.#router.getAllowedMethods(matched.pattern);
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
        params,
        this.config,
        next,
        this.#islandRegistry,
        this.#buildCache!,
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

// deno-lint-ignore require-await
const missingBuildHandler = async (): Promise<Response> => {
  const headers = new Headers();
  headers.set("Content-Type", "text/html; charset=utf-8");

  const html = DENO_DEPLOYMENT_ID
    ? renderToString(h(FinishSetup, null))
    : renderToString(h(ForgotBuild, null));
  return new Response(html, { headers, status: 500 });
};

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
