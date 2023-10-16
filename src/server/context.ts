import {
  colors,
  extname,
  join,
  Status,
  toFileUrl,
  typeByExtension,
  walk,
} from "./deps.ts";
import { ComponentType, h } from "preact";
import * as router from "./router.ts";
import { FreshConfig, Manifest } from "./mod.ts";
import { ALIVE_URL, JS_PREFIX } from "./constants.ts";
import { BUILD_ID, setBuildId } from "./build_id.ts";
import DefaultErrorHandler from "./default_error_page.tsx";
import {
  AppModule,
  BaseRoute,
  ErrorPage,
  ErrorPageModule,
  Handler,
  InternalFreshConfig,
  Island,
  LayoutModule,
  LayoutRoute,
  MiddlewareHandler,
  MiddlewareHandlerContext,
  MiddlewareModule,
  MiddlewareRoute,
  Plugin,
  RenderFunction,
  RenderOptions,
  Route,
  RouteModule,
  RouterOptions,
  RouterState,
  ServeHandlerInfo,
  UnknownPage,
  UnknownPageModule,
} from "./types.ts";
import { DEFAULT_RENDER_FN, render as internalRender } from "./render.ts";
import {
  ContentSecurityPolicy,
  ContentSecurityPolicyDirectives,
  SELF,
} from "../runtime/csp.ts";
import { ASSET_CACHE_BUST_KEY, INTERNAL_PREFIX } from "../runtime/utils.ts";
import {
  AotSnapshot,
  Builder,
  BuildSnapshot,
  BuildSnapshotJson,
  EsbuildBuilder,
  JSXConfig,
} from "../build/mod.ts";
import { InternalRoute } from "./router.ts";
import { setAllIslands } from "./rendering/preact_hooks.ts";
import { getCodeFrame } from "./code_frame.ts";
import { getFreshConfigWithDefaults } from "./config.ts";

const DEFAULT_CONN_INFO: ServeHandlerInfo = {
  localAddr: { transport: "tcp", hostname: "localhost", port: 8080 },
  remoteAddr: { transport: "tcp", hostname: "localhost", port: 1234 },
};

const ROOT_BASE_ROUTE = toBaseRoute("/");

interface StaticFile {
  /** The URL to the static file on disk. */
  localUrl: URL;
  /** The path to the file as it would be in the incoming request. */
  path: string;
  /** The size of the file. */
  size: number;
  /** The content-type of the file. */
  contentType: string;
  /** Hash of the file contents. */
  etag: string;
}

/**
 * @deprecated Use {@linkcode FromManifestConfig} instead
 */
export type FromManifestOptions = FromManifestConfig;

export type FromManifestConfig = FreshConfig & {
  skipSnapshot?: boolean;
  dev?: boolean;
};

export async function getServerContext(opts: InternalFreshConfig) {
  const { manifest, denoJson: config, denoJsonPath: configPath } = opts;
  // Get the manifest' base URL.
  const baseUrl = new URL("./", manifest.baseUrl).href;

  // Restore snapshot if available
  let snapshot: BuildSnapshot | null = null;
  if (opts.loadSnapshot) {
    const snapshotDirPath = opts.build.outDir;
    try {
      if ((await Deno.stat(snapshotDirPath)).isDirectory) {
        console.log(
          `Using snapshot found at ${colors.cyan(snapshotDirPath)}`,
        );

        const snapshotPath = join(snapshotDirPath, "snapshot.json");
        const json = JSON.parse(
          await Deno.readTextFile(snapshotPath),
        ) as BuildSnapshotJson;
        setBuildId(json.build_id);

        const dependencies = new Map<string, string[]>(
          Object.entries(json.files),
        );

        const files = new Map<string, string>();
        Object.keys(json.files).forEach((name) => {
          const filePath = join(snapshotDirPath, name);
          files.set(name, filePath);
        });

        snapshot = new AotSnapshot(files, dependencies);
      }
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) {
        throw err;
      }
    }
  }

  config.compilerOptions ??= {};

  let jsx: "react" | "react-jsx";
  switch (config.compilerOptions.jsx) {
    case "react":
    case undefined:
      jsx = "react";
      break;
    case "react-jsx":
      jsx = "react-jsx";
      break;
    default:
      throw new Error("Unknown jsx option: " + config.compilerOptions.jsx);
  }

  const jsxConfig: JSXConfig = {
    jsx,
    jsxImportSource: config.compilerOptions.jsxImportSource,
  };

  // Extract all routes, and prepare them into the `Page` structure.
  const routes: Route[] = [];
  const islands: Island[] = [];
  const middlewares: MiddlewareRoute[] = [];
  let app: AppModule = DEFAULT_APP;
  const layouts: LayoutRoute[] = [];
  let notFound: UnknownPage = DEFAULT_NOT_FOUND;
  let error: ErrorPage = DEFAULT_ERROR;
  const allRoutes = [
    ...Object.entries(manifest.routes),
    ...(opts.plugins ? getMiddlewareRoutesFromPlugins(opts.plugins) : []),
    ...(opts.plugins ? getRoutesFromPlugins(opts.plugins) : []),
  ];

  // Presort all routes so that we only need to sort once
  allRoutes.sort((a, b) => sortRoutePaths(a[0], b[0]));

  for (
    const [self, module] of allRoutes
  ) {
    const url = new URL(self, baseUrl).href;
    if (!url.startsWith(baseUrl + "routes")) {
      throw new TypeError("Page is not a child of the basepath.");
    }
    const path = url.substring(baseUrl.length + "routes".length);
    const baseRoute = path.substring(1, path.length - extname(path).length);
    const name = baseRoute.replace("/", "-");
    const isLayout = path.endsWith("/_layout.tsx") ||
      path.endsWith("/_layout.ts") || path.endsWith("/_layout.jsx") ||
      path.endsWith("/_layout.js");
    const isMiddleware = path.endsWith("/_middleware.tsx") ||
      path.endsWith("/_middleware.ts") || path.endsWith("/_middleware.jsx") ||
      path.endsWith("/_middleware.js");
    if (
      !path.startsWith("/_") && !isLayout && !isMiddleware
    ) {
      const { default: component, config } = module as RouteModule;
      let pattern = pathToPattern(baseRoute);
      if (config?.routeOverride) {
        pattern = String(config.routeOverride);
      }
      let { handler } = module as RouteModule;
      if (!handler && "handlers" in module) {
        throw new Error(
          `Found named export "handlers" in ${self} instead of "handler". Did you mean "handler"?`,
        );
      }
      handler ??= {};
      if (
        component && typeof handler === "object" && handler.GET === undefined
      ) {
        handler.GET = (_req, { render }) => render();
      }
      if (
        typeof handler === "object" && handler.GET !== undefined &&
        handler.HEAD === undefined
      ) {
        const GET = handler.GET;
        handler.HEAD = async (req, ctx) => {
          const resp = await GET(req, ctx);
          resp.body?.cancel();
          return new Response(null, {
            headers: resp.headers,
            status: resp.status,
            statusText: resp.statusText,
          });
        };
      }
      const route: Route = {
        baseRoute: toBaseRoute(baseRoute),
        pattern,
        url,
        name,
        component,
        handler,
        csp: Boolean(config?.csp ?? false),
        appWrapper: !config?.skipAppWrapper,
        inheritLayouts: !config?.skipInheritedLayouts,
      };
      routes.push(route);
    } else if (isMiddleware) {
      middlewares.push({
        baseRoute: toBaseRoute(baseRoute),
        module: module as MiddlewareModule,
      });
    } else if (
      path === "/_app.tsx" || path === "/_app.ts" ||
      path === "/_app.jsx" || path === "/_app.js"
    ) {
      app = module as AppModule;
    } else if (isLayout) {
      const mod = module as LayoutModule;
      const config = mod.config;
      layouts.push({
        baseRoute: toBaseRoute(baseRoute),
        handler: mod.handler,
        component: mod.default,
        appWrapper: !config?.skipAppWrapper,
        inheritLayouts: !config?.skipInheritedLayouts,
      });
    } else if (
      path === "/_404.tsx" || path === "/_404.ts" ||
      path === "/_404.jsx" || path === "/_404.js"
    ) {
      const { default: component, config } = module as UnknownPageModule;
      let { handler } = module as UnknownPageModule;
      if (component && handler === undefined) {
        handler = (_req, { render }) => render();
      }

      notFound = {
        baseRoute: ROOT_BASE_ROUTE,
        pattern: pathToPattern(baseRoute),
        url,
        name,
        component,
        handler: handler ?? ((req) => router.defaultOtherHandler(req)),
        csp: Boolean(config?.csp ?? false),
        appWrapper: !config?.skipAppWrapper,
        inheritLayouts: !config?.skipInheritedLayouts,
      };
    } else if (
      path === "/_500.tsx" || path === "/_500.ts" ||
      path === "/_500.jsx" || path === "/_500.js"
    ) {
      const { default: component, config } = module as ErrorPageModule;
      let { handler } = module as ErrorPageModule;
      if (component && handler === undefined) {
        handler = (_req, { render }) => render();
      }

      error = {
        baseRoute: toBaseRoute("/"),
        pattern: pathToPattern(baseRoute),
        url,
        name,
        component,
        handler: (req, ctx) => {
          if (opts.dev) {
            const prevComp = error.component;
            error.component = DefaultErrorHandler;
            try {
              return ctx.render();
            } finally {
              error.component = prevComp;
            }
          }

          return handler
            ? handler(req, ctx)
            : router.defaultErrorHandler(req, ctx, ctx.error);
        },
        csp: Boolean(config?.csp ?? false),
        appWrapper: !config?.skipAppWrapper,
        inheritLayouts: !config?.skipInheritedLayouts,
      };
    }
  }

  for (const [self, module] of Object.entries(manifest.islands)) {
    const url = new URL(self, baseUrl).href;
    if (!url.startsWith(baseUrl)) {
      throw new TypeError("Island is not a child of the basepath.");
    }
    let path = url.substring(baseUrl.length);
    if (path.startsWith("islands")) {
      path = path.slice("islands".length + 1);
    }
    const baseRoute = path.substring(0, path.length - extname(path).length);

    for (const [exportName, exportedFunction] of Object.entries(module)) {
      if (typeof exportedFunction !== "function") {
        continue;
      }
      const name = sanitizeIslandName(baseRoute);
      const id = `${name}_${exportName}`.toLowerCase();
      islands.push({
        id,
        name,
        url,
        component: exportedFunction,
        exportName,
      });
    }
  }

  const staticFiles: StaticFile[] = [];
  try {
    const staticDirUrl = toFileUrl(opts.staticDir);
    const entries = walk(opts.staticDir, {
      includeFiles: true,
      includeDirs: false,
      followSymlinks: false,
    });
    const encoder = new TextEncoder();
    for await (const entry of entries) {
      const localUrl = toFileUrl(entry.path);
      const path = localUrl.href.substring(staticDirUrl.href.length);
      const stat = await Deno.stat(localUrl);
      const contentType = typeByExtension(extname(path)) ??
        "application/octet-stream";
      const etag = await crypto.subtle.digest(
        "SHA-1",
        encoder.encode(BUILD_ID + path),
      ).then((hash) =>
        Array.from(new Uint8Array(hash))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("")
      );
      const staticFile: StaticFile = {
        localUrl,
        path,
        size: stat.size,
        contentType,
        etag,
      };
      staticFiles.push(staticFile);
    }
  } catch (err) {
    if (err.cause instanceof Deno.errors.NotFound) {
      // Do nothing.
    } else {
      throw err;
    }
  }

  if (opts.dev) {
    // Ensure that debugging hooks are set up for SSR rendering
    await import("preact/debug");
  }

  return new ServerContext(
    routes,
    islands,
    staticFiles,
    opts.render ?? DEFAULT_RENDER_FN,
    middlewares,
    app,
    layouts,
    notFound,
    error,
    opts.plugins ?? [],
    configPath,
    jsxConfig,
    opts.dev,
    opts.router ?? DEFAULT_ROUTER_OPTIONS,
    opts.build.target,
    snapshot,
  );
}

export class ServerContext {
  #dev: boolean;
  #routes: Route[];
  #islands: Island[];
  #staticFiles: StaticFile[];
  #renderFn: RenderFunction;
  #middlewares: MiddlewareRoute[];
  #app: AppModule;
  #layouts: LayoutRoute[];
  #notFound: UnknownPage;
  #error: ErrorPage;
  #plugins: Plugin[];
  #builder: Builder | Promise<BuildSnapshot> | BuildSnapshot;
  #routerOptions: RouterOptions;

  constructor(
    routes: Route[],
    islands: Island[],
    staticFiles: StaticFile[],
    renderfn: RenderFunction,
    middlewares: MiddlewareRoute[],
    app: AppModule,
    layouts: LayoutRoute[],
    notFound: UnknownPage,
    error: ErrorPage,
    plugins: Plugin[],
    configPath: string,
    jsxConfig: JSXConfig,
    dev: boolean,
    routerOptions: RouterOptions,
    target: string | string[],
    snapshot: BuildSnapshot | null = null,
  ) {
    this.#routes = routes;
    this.#islands = islands;
    this.#staticFiles = staticFiles;
    this.#renderFn = renderfn;
    this.#middlewares = middlewares;
    this.#app = app;
    this.#layouts = layouts;
    this.#notFound = notFound;
    this.#error = error;
    this.#plugins = plugins;
    this.#dev = dev;
    this.#builder = snapshot ?? new EsbuildBuilder({
      buildID: BUILD_ID,
      entrypoints: collectEntrypoints(this.#dev, this.#islands, this.#plugins),
      configPath,
      dev: this.#dev,
      jsxConfig,
      target,
    });
    this.#routerOptions = routerOptions;
  }

  /**
   * Process the manifest into individual components and pages.
   */
  static async fromManifest(
    manifest: Manifest,
    config: FromManifestConfig,
  ): Promise<ServerContext> {
    const isLegacyDev = Deno.env.get("__FRSH_LEGACY_DEV") === "true";
    config.dev = isLegacyDev ||
      Boolean(config.dev);

    if (isLegacyDev) {
      config.skipSnapshot = true;
    }

    const configWithDefaults = await getFreshConfigWithDefaults(
      manifest,
      config,
    );
    return getServerContext(configWithDefaults);
  }

  /**
   * This functions returns a request handler that handles all routes required
   * by Fresh, including static files.
   */
  handler(): (req: Request, connInfo?: ServeHandlerInfo) => Promise<Response> {
    const handlers = this.#handlers();
    const inner = router.router<RouterState>(handlers);
    const withMiddlewares = this.#composeMiddlewares(
      this.#middlewares,
      handlers.errorHandler,
      router.getParamsAndRoute<RouterState>(handlers),
    );
    const trailingSlashEnabled = this.#routerOptions?.trailingSlash;
    const isDev = this.#dev;

    return async function handler(
      req: Request,
      connInfo: ServeHandlerInfo = DEFAULT_CONN_INFO,
    ) {
      const url = new URL(req.url);

      // Live reload: Send updates to browser
      if (isDev && url.pathname === ALIVE_URL) {
        if (req.headers.get("upgrade") !== "websocket") {
          return new Response(null, { status: 501 });
        }

        // TODO: When a change is made the Deno server restarts,
        // so for now the WebSocket connection is only used for
        // the client to know when the server is back up. Once we
        // have HMR we'll actively start sending messages back
        // and forth.
        const { response } = Deno.upgradeWebSocket(req);

        return response;
      }

      // Redirect requests that end with a trailing slash to their non-trailing
      // slash counterpart.
      // Ex: /about/ -> /about
      if (
        url.pathname.length > 1 && url.pathname.endsWith("/") &&
        !trailingSlashEnabled
      ) {
        // Remove trailing slashes
        const path = url.pathname.replace(/\/+$/, "");
        const location = `${path}${url.search}`;
        return new Response(null, {
          status: Status.TemporaryRedirect,
          headers: { location },
        });
      } else if (trailingSlashEnabled && !url.pathname.endsWith("/")) {
        // If the last element of the path has a "." it's a file
        const isFile = url.pathname.split("/").at(-1)?.includes(".");

        // If the path uses the internal prefix, don't redirect it
        const isInternal = url.pathname.startsWith(INTERNAL_PREFIX);

        if (!isFile && !isInternal) {
          url.pathname += "/";
          return Response.redirect(url, Status.PermanentRedirect);
        }
      }

      return await withMiddlewares(req, connInfo, inner);
    };
  }

  #maybeBuildSnapshot(): BuildSnapshot | null {
    if ("build" in this.#builder || this.#builder instanceof Promise) {
      return null;
    }
    return this.#builder;
  }

  async buildSnapshot() {
    if ("build" in this.#builder) {
      const builder = this.#builder;
      this.#builder = builder.build();
      try {
        const snapshot = await this.#builder;
        this.#builder = snapshot;
      } catch (err) {
        this.#builder = builder;
        throw err;
      }
    }
    return this.#builder;
  }

  /**
   * Identify which middlewares should be applied for a request,
   * chain them and return a handler response
   */
  #composeMiddlewares(
    middlewares: MiddlewareRoute[],
    errorHandler: router.ErrorHandler<RouterState>,
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
      inner: router.FinalHandler<RouterState>,
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

  /**
   * This function returns all routes required by Fresh as an extended
   * path-to-regex, to handler mapping.
   */
  #handlers(): {
    internalRoutes: router.Routes<RouterState>;
    staticRoutes: router.Routes<RouterState>;
    routes: router.Routes<RouterState>;

    otherHandler: router.Handler<RouterState>;
    errorHandler: router.ErrorHandler<RouterState>;
  } {
    const internalRoutes: router.Routes<RouterState> = {};
    const staticRoutes: router.Routes<RouterState> = {};
    const routes: router.Routes<RouterState> = {};

    internalRoutes[`${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}/:path*`] = {
      baseRoute: toBaseRoute(
        `${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}/:path*`,
      ),
      methods: {
        default: this.#bundleAssetRoute(),
      },
    };

    // Add the static file routes.
    // each files has 2 static routes:
    // - one serving the file at its location without a "cache bursting" mechanism
    // - one containing the BUILD_ID in the path that can be cached
    for (
      const { localUrl, path, size, contentType, etag } of this.#staticFiles
    ) {
      const route = sanitizePathToRegex(path);
      staticRoutes[route] = {
        baseRoute: toBaseRoute(route),
        methods: {
          "HEAD": this.#staticFileHeadHandler(
            size,
            contentType,
            etag,
          ),
          "GET": this.#staticFileGetHandler(
            localUrl,
            size,
            contentType,
            etag,
          ),
        },
      };
    }

    // Tell renderer about all globally available islands
    setAllIslands(this.#islands);

    const dependenciesFn = (path: string) => {
      const snapshot = this.#maybeBuildSnapshot();
      return snapshot?.dependencies(path) ?? [];
    };

    const renderNotFound = async <Data = undefined>(
      req: Request,
      params: Record<string, string>,
      // deno-lint-ignore no-explicit-any
      ctx?: any,
      data?: Data,
      error?: unknown,
    ) => {
      const notFound = this.#notFound;
      if (!notFound.component) {
        return sendResponse(["Not found.", undefined], {
          status: Status.NotFound,
          isDev: this.#dev,
          statusText: undefined,
          headers: undefined,
        });
      }

      const layouts = selectSharedRoutes(ROOT_BASE_ROUTE, this.#layouts);

      const imports: string[] = [];
      const resp = await internalRender({
        request: req,
        context: ctx,
        route: notFound,
        plugins: this.#plugins,
        app: this.#app,
        layouts,
        imports,
        dependenciesFn,
        renderFn: this.#renderFn,
        url: new URL(req.url),
        params,
        data,
        state: ctx?.state,
        error,
      });

      if (resp instanceof Response) {
        return resp;
      }

      return sendResponse(resp, {
        status: Status.NotFound,
        isDev: this.#dev,
        statusText: undefined,
        headers: undefined,
      });
    };

    const genRender = <Data = undefined>(
      route: Route<Data> | UnknownPage | ErrorPage,
      status: number,
    ) => {
      const imports: string[] = [];
      return (
        req: Request,
        params: Record<string, string>,
        // deno-lint-ignore no-explicit-any
        ctx?: any,
        error?: unknown,
        codeFrame?: string,
      ) => {
        return async (data?: Data, options?: RenderOptions) => {
          if (route.component === undefined) {
            throw new Error("This page does not have a component to render.");
          }
          const layouts = selectSharedRoutes(route.baseRoute, this.#layouts);

          const resp = await internalRender({
            request: req,
            context: {
              ...ctx,
              async renderNotFound() {
                return await renderNotFound(req, params, ctx, data, error);
              },
            },
            route,
            plugins: this.#plugins,
            app: this.#app,
            layouts,
            imports,
            dependenciesFn,
            renderFn: this.#renderFn,
            url: new URL(req.url),
            params,
            data,
            state: ctx?.state,
            error,
            codeFrame,
          });

          if (resp instanceof Response) {
            return resp;
          }

          return sendResponse(resp, {
            status: options?.status ?? status,
            statusText: options?.statusText,
            headers: options?.headers,
            isDev: this.#dev,
          });
        };
      };
    };

    for (const route of this.#routes) {
      if (this.#routerOptions.trailingSlash && route.pattern != "/") {
        route.pattern += "/";
      }
      const createRender = genRender(route, Status.OK);
      if (typeof route.handler === "function") {
        routes[route.pattern] = {
          baseRoute: route.baseRoute,
          methods: {
            default: (req, ctx, params) =>
              (route.handler as Handler)(req, {
                ...ctx,
                params,
                render: createRender(req, params, ctx),
                async renderNotFound<Data = undefined>(data: Data) {
                  return await renderNotFound(req, params, ctx, data);
                },
              }),
          },
        };
      } else {
        routes[route.pattern] = {
          baseRoute: route.baseRoute,
          methods: {},
        };
        for (const [method, handler] of Object.entries(route.handler)) {
          routes[route.pattern].methods[method as router.KnownMethod] = (
            req,
            ctx,
            params,
          ) =>
            handler(req, {
              ...ctx,
              params,
              render: createRender(req, params, ctx),
              async renderNotFound<Data = undefined>(data: Data) {
                return await renderNotFound(req, params, ctx, data);
              },
            });
        }
      }
    }

    const otherHandler: router.Handler<RouterState> = (
      req,
      ctx,
    ) =>
      this.#notFound.handler(
        req,
        {
          ...ctx,
          render() {
            return renderNotFound(req, {}, ctx);
          },
        },
      );

    const errorHandlerRender = genRender(
      this.#error,
      Status.InternalServerError,
    );
    const errorHandler: router.ErrorHandler<RouterState> = async (
      req,
      ctx,
      error,
    ) => {
      console.error(
        "%cAn error occurred during route handling or page rendering.",
        "color:red",
      );
      let codeFrame: string | undefined;
      if (this.#dev && error instanceof Error) {
        codeFrame = await getCodeFrame(error);

        if (codeFrame) {
          console.error();
          console.error(codeFrame);
        }
      }
      console.error(error);

      return this.#error.handler(
        req,
        {
          ...ctx,
          error,
          render: errorHandlerRender(req, {}, ctx, error, codeFrame),
        },
      );
    };

    return { internalRoutes, staticRoutes, routes, otherHandler, errorHandler };
  }

  #staticFileHeadHandler(
    size: number,
    contentType: string,
    etag: string,
  ): router.MatchHandler {
    return (req: Request) => {
      const url = new URL(req.url);
      const key = url.searchParams.get(ASSET_CACHE_BUST_KEY);
      if (key !== null && BUILD_ID !== key) {
        url.searchParams.delete(ASSET_CACHE_BUST_KEY);
        const location = url.pathname + url.search;
        return new Response(null, {
          status: 307,
          headers: {
            location,
          },
        });
      }
      const headers = new Headers({
        "content-type": contentType,
        etag,
        vary: "If-None-Match",
      });
      if (key !== null) {
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
      }
      const ifNoneMatch = req.headers.get("if-none-match");
      if (ifNoneMatch === etag || ifNoneMatch === "W/" + etag) {
        return new Response(null, { status: 304, headers });
      } else {
        headers.set("content-length", String(size));
        return new Response(null, { status: 200, headers });
      }
    };
  }

  #staticFileGetHandler(
    localUrl: URL,
    size: number,
    contentType: string,
    etag: string,
  ): router.MatchHandler {
    return async (req: Request) => {
      const url = new URL(req.url);
      const key = url.searchParams.get(ASSET_CACHE_BUST_KEY);
      if (key !== null && BUILD_ID !== key) {
        url.searchParams.delete(ASSET_CACHE_BUST_KEY);
        const location = url.pathname + url.search;
        return new Response("", {
          status: 307,
          headers: {
            "content-type": "text/plain",
            location,
          },
        });
      }
      const headers = new Headers({
        "content-type": contentType,
        etag,
        vary: "If-None-Match",
      });
      if (key !== null) {
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
      }
      const ifNoneMatch = req.headers.get("if-none-match");
      if (ifNoneMatch === etag || ifNoneMatch === "W/" + etag) {
        return new Response(null, { status: 304, headers });
      } else {
        const file = await Deno.open(localUrl);
        headers.set("content-length", String(size));
        return new Response(file.readable, { headers });
      }
    };
  }

  /**
   * Returns a router that contains all Fresh routes. Should be mounted at
   * constants.INTERNAL_PREFIX
   */
  #bundleAssetRoute = (): router.MatchHandler => {
    return async (_req, _ctx, params) => {
      const snapshot = await this.buildSnapshot();
      const contents = await snapshot.read(params.path);
      if (!contents) return new Response(null, { status: 404 });

      const headers: Record<string, string> = {
        "Cache-Control": "public, max-age=604800, immutable",
      };

      const contentType = typeByExtension(extname(params.path));
      if (contentType) headers["Content-Type"] = contentType;

      return new Response(contents, {
        status: 200,
        headers,
      });
    };
  };
}

const DEFAULT_ROUTER_OPTIONS: RouterOptions = {
  trailingSlash: false,
};

const DEFAULT_APP: AppModule = {
  default: ({ Component }: { Component: ComponentType }) => h(Component, {}),
};

const DEFAULT_NOT_FOUND: UnknownPage = {
  baseRoute: toBaseRoute("/"),
  pattern: "",
  url: "",
  name: "_404",
  handler: (req) => router.defaultOtherHandler(req),
  csp: false,
  appWrapper: true,
  inheritLayouts: true,
};

const DEFAULT_ERROR: ErrorPage = {
  baseRoute: toBaseRoute("/"),
  pattern: "",
  url: "",
  name: "_500",
  component: DefaultErrorHandler,
  handler: (_req, ctx) => ctx.render(),
  csp: false,
  appWrapper: true,
  inheritLayouts: true,
};

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

const APP_REG = /_app\.[tj]sx?$/;

/**
 * Sort route paths where special Fresh files like `_app`,
 * `_layout` and `_middleware` are sorted in front.
 */
export function sortRoutePaths(a: string, b: string) {
  // The `_app` route should always be the first
  if (APP_REG.test(a)) return -1;
  else if (APP_REG.test(b)) return 1;

  let segmentIdx = 0;
  const aLen = a.length;
  const bLen = b.length;
  const maxLen = aLen > bLen ? aLen : bLen;
  for (let i = 0; i < maxLen; i++) {
    const charA = a.charAt(i);
    const charB = b.charAt(i);
    const nextA = i + 1 < aLen ? a.charAt(i + 1) : "";
    const nextB = i + 1 < bLen ? b.charAt(i + 1) : "";

    if (charA === "/" || charB === "/") {
      segmentIdx = i;
      // If the other path doesn't close the segment
      // then we don't need to continue
      if (charA !== "/") return -1;
      if (charB !== "/") return 1;
      continue;
    }

    if (i === segmentIdx + 1) {
      const scoreA = getRoutePathScore(charA, nextA);
      const scoreB = getRoutePathScore(charB, nextB);
      if (scoreA === scoreB) continue;
      return scoreA > scoreB ? -1 : 1;
    }
  }

  return 0;
}

/**
 * Assign a score based on the first two characters of a path segment.
 * The goal is to sort `_middleware` and `_layout` in front of everything
 * and `[` or `[...` last respectively.
 */
function getRoutePathScore(char: string, nextChar: string): number {
  if (char === "_") {
    if (nextChar === "m") return 4;
    return 3;
  } else if (char === "[") {
    if (nextChar === ".") {
      return 0;
    }
    return 1;
  }
  return 2;
}

/** Transform a filesystem URL path to a `path-to-regex` style matcher. */
export function pathToPattern(path: string): string {
  const parts = path.split("/");
  if (parts[parts.length - 1] === "index") {
    if (parts.length === 1) {
      return "/";
    }
    parts.pop();
  }

  let route = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Case: /[...foo].tsx
    if (part.startsWith("[...") && part.endsWith("]")) {
      route += `/:${part.slice(4, part.length - 1)}*`;
      continue;
    }

    // Route groups like /foo/(bar) should not be included in URL
    // matching. They are transparent and need to be removed here.
    // Case: /foo/(bar) -> /foo
    // Case: /foo/(bar)/bob -> /foo/bob
    // Case: /(foo)/bar -> /bar
    if (part.startsWith("(") && part.endsWith(")")) {
      continue;
    }

    // Disallow neighbouring params like `/[id][bar].tsx` because
    // it's ambiguous where the `id` param ends and `bar` begins.
    if (part.includes("][")) {
      throw new SyntaxError(
        `Invalid route pattern: "${path}". A parameter cannot be followed by another parameter without any characters in between.`,
      );
    }

    // Case: /[[id]].tsx
    // Case: /[id].tsx
    // Case: /[id]@[bar].tsx
    // Case: /[id]-asdf.tsx
    // Case: /[id]-asdf[bar].tsx
    // Case: /asdf[bar].tsx
    let pattern = "";
    let groupOpen = 0;
    let optional = false;
    for (let j = 0; j < part.length; j++) {
      const char = part[j];
      if (char === "[") {
        if (part[j + 1] === "[") {
          // Disallow optional dynamic params like `foo-[[bar]]`
          if (part[j - 1] !== "/" && !!part[j - 1]) {
            throw new SyntaxError(
              `Invalid route pattern: "${path}". An optional parameter needs to be a full segment.`,
            );
          }
          groupOpen++;
          optional = true;
          pattern += "{/";
          j++;
        }
        pattern += ":";
        groupOpen++;
      } else if (char === "]") {
        if (part[j + 1] === "]") {
          // Disallow optional dynamic params like `[[foo]]-bar`
          if (part[j + 2] !== "/" && !!part[j + 2]) {
            throw new SyntaxError(
              `Invalid route pattern: "${path}". An optional parameter needs to be a full segment.`,
            );
          }
          groupOpen--;
          pattern += "}?";
          j++;
        }
        if (--groupOpen < 0) {
          throw new SyntaxError(`Invalid route pattern: "${path}"`);
        }
      } else {
        pattern += char;
      }
    }

    route += (optional ? "" : "/") + pattern;
  }

  // Case: /(group)/index.tsx
  if (route === "") {
    route = "/";
  }

  return route;
}

// Normalize a path for use in a URL. Returns null if the path is unparsable.
export function normalizeURLPath(path: string): string | null {
  try {
    const pathUrl = new URL("file:///");
    pathUrl.pathname = path;
    return pathUrl.pathname;
  } catch {
    return null;
  }
}

function sanitizePathToRegex(path: string): string {
  return path
    .replaceAll("\*", "\\*")
    .replaceAll("\+", "\\+")
    .replaceAll("\?", "\\?")
    .replaceAll("\{", "\\{")
    .replaceAll("\}", "\\}")
    .replaceAll("\(", "\\(")
    .replaceAll("\)", "\\)")
    .replaceAll("\:", "\\:");
}

function toPascalCase(text: string): string {
  return text.replace(
    /(^\w|-\w)/g,
    (substring) => substring.replace(/-/, "").toUpperCase(),
  );
}

function sanitizeIslandName(name: string): string {
  const fileName = name.replaceAll(/[/\\\\\(\)\[\]]/g, "_");
  return toPascalCase(fileName);
}

function serializeCSPDirectives(csp: ContentSecurityPolicyDirectives): string {
  return Object.entries(csp)
    .filter(([_key, value]) => value !== undefined)
    .map(([k, v]: [string, string | string[]]) => {
      // Turn camel case into snake case.
      const key = k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      const value = Array.isArray(v) ? v.join(" ") : v;
      return `${key} ${value}`;
    })
    .join("; ");
}

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

function collectEntrypoints(
  dev: boolean,
  islands: Island[],
  plugins: Plugin[],
): Record<string, string> {
  const entrypointBase = "../runtime/entrypoints";
  const entryPoints: Record<string, string> = {
    main: dev
      ? import.meta.resolve(`${entrypointBase}/main_dev.ts`)
      : import.meta.resolve(`${entrypointBase}/main.ts`),
    deserializer: import.meta.resolve(`${entrypointBase}/deserializer.ts`),
  };

  try {
    import.meta.resolve("@preact/signals");
    entryPoints.signals = import.meta.resolve(`${entrypointBase}/signals.ts`);
  } catch {
    // @preact/signals is not in the import map
  }

  for (const island of islands) {
    entryPoints[`island-${island.id}`] = island.url;
  }

  for (const plugin of plugins) {
    for (const [name, url] of Object.entries(plugin.entrypoints ?? {})) {
      entryPoints[`plugin-${plugin.name}-${name}`] = url;
    }
  }

  return entryPoints;
}

function formatMiddlewarePath(path: string): string {
  const prefix = !path.startsWith("/") ? "/" : "";
  const suffix = !path.endsWith("/") ? "/" : "";
  return prefix + path + suffix;
}

function getMiddlewareRoutesFromPlugins(
  plugins: Plugin[],
): [string, MiddlewareModule][] {
  const middlewares = plugins.flatMap((plugin) => plugin.middlewares ?? []);

  const mws: Record<
    string,
    [string, { handler: MiddlewareHandler[] }]
  > = {};
  for (let i = 0; i < middlewares.length; i++) {
    const mw = middlewares[i];
    const handler = mw.middleware.handler;
    const key = `./routes${formatMiddlewarePath(mw.path)}_middleware.ts`;
    if (!mws[key]) mws[key] = [key, { handler: [] }];
    mws[key][1].handler.push(...Array.isArray(handler) ? handler : [handler]);
  }

  return Object.values(mws);
}

function formatRoutePath(path: string) {
  return path.startsWith("/") ? path : "/" + path;
}

function getRoutesFromPlugins(plugins: Plugin[]): [string, RouteModule][] {
  return plugins.flatMap((plugin) => plugin.routes ?? [])
    .map((route) => {
      return [`./routes${formatRoutePath(route.path)}.ts`, {
        // deno-lint-ignore no-explicit-any
        default: route.component as any,
        handler: route.handler,
      }];
    });
}

function sendResponse(
  resp: [string, ContentSecurityPolicy | undefined],
  options: {
    status: number;
    statusText: string | undefined;
    headers?: HeadersInit;
    isDev: boolean;
  },
) {
  const headers: Record<string, string> = {
    "content-type": "text/html; charset=utf-8",
  };

  const [body, csp] = resp;
  if (csp) {
    if (options.isDev) {
      csp.directives.connectSrc = [
        ...(csp.directives.connectSrc ?? []),
        SELF,
      ];
    }
    const directive = serializeCSPDirectives(csp.directives);
    if (csp.reportOnly) {
      headers["content-security-policy-report-only"] = directive;
    } else {
      headers["content-security-policy"] = directive;
    }
  }

  if (options.headers) {
    if (Array.isArray(options.headers)) {
      for (let i = 0; i < options.headers.length; i++) {
        const item = options.headers[i];
        headers[item[0]] = item[1];
      }
    } else if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  return new Response(body, {
    status: options.status,
    statusText: options.statusText,
    headers,
  });
}
