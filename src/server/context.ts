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
import { JS_PREFIX } from "./constants.ts";
import { BUILD_ID, setBuildId } from "./build_id.ts";
import DefaultErrorHandler from "./default_error_page.tsx";
import {
  AppModule,
  BaseRoute,
  ErrorPage,
  ErrorPageModule,
  Handler,
  InternalFreshState,
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
import {
  AotSnapshot,
  Builder,
  BuildSnapshot,
  JSXConfig,
} from "../build/mod.ts";
import { InternalRoute } from "./router.ts";
import { setAllIslands } from "./rendering/preact_hooks.ts";
import { getCodeFrame } from "./code_frame.ts";
import { getInternalFreshState } from "./config.ts";
import {
  ALIVE_URL,
  ASSET_CACHE_BUST_KEY,
  DEV_CLIENT_URL,
  INTERNAL_PREFIX,
} from "../constants.ts";
import { loadAotSnapshot } from "../build/aot_snapshot.ts";
import { JitSnapshot } from "../build/jit_snapshot.ts";
import { DevSnapshot } from "$fresh/src/build/dev_snapshot.ts";

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

export async function getServerContext(state: InternalFreshState) {
  const { manifest, config, denoJsonPath: configPath } = state;
  // Get the manifest' base URL.
  const baseUrl = new URL("./", manifest.baseUrl).href;

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
    ...(config.plugins ? getMiddlewareRoutesFromPlugins(config.plugins) : []),
    ...(config.plugins ? getRoutesFromPlugins(config.plugins) : []),
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
      const { default: component, config: routeConfig } =
        module as ErrorPageModule;
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
          if (config.dev) {
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
        csp: Boolean(routeConfig?.csp ?? false),
        appWrapper: !routeConfig?.skipAppWrapper,
        inheritLayouts: !routeConfig?.skipInheritedLayouts,
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

  // Tell renderer about all globally available islands
  // TODO: Find a better way to move that to render state?
  setAllIslands(islands);

  const staticFiles: StaticFile[] = [];

  if (config.dev) {
    // Ensure that debugging hooks are set up for SSR rendering
    await import("preact/debug");
  }

  // Restore snapshot if available
  let snapshot: BuildSnapshot | null = null;
  if (state.loadSnapshot) {
    snapshot = await loadAotSnapshot(config.build.outDir);
  } else if (config.dev) {
    // TODO
  } else {
    snapshot = new JitSnapshot({
      buildID: BUILD_ID,
      entrypoints: collectEntrypoints(config.dev, islands, config.plugins),
      configPath,
      dev: config.dev,
      target: config.build.target,
      absoluteWorkingDir: Deno.cwd(),
    });
  }

  return new ServerContext(
    state,
    routes,
    islands,
    staticFiles,
    config.render,
    middlewares,
    app,
    layouts,
    notFound,
    error,
    config.plugins ?? [],
    configPath,
    jsxConfig,
    config.dev,
    config.router,
    config.build.target,
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
  #state: InternalFreshState;

  constructor(
    state: InternalFreshState,
  ) {
    this.#state = state;
  }

  /**
   * Process the manifest into individual components and pages.
   */
  static async fromManifest(
    manifest: Manifest,
    config: FromManifestConfig,
  ): Promise<ServerContext> {
    const configWithDefaults = await getInternalFreshState(
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
    const bundleAssetRoute = this.#bundleAssetRoute();

    const snapshot: any = null;
    const staticFiles: any = null;

    return async function handler(
      req: Request,
      connInfo: ServeHandlerInfo = DEFAULT_CONN_INFO,
    ) {
      const url = new URL(req.url);

      if (isDev) {
        // Live reload: Send updates to browser
        if (url.pathname === ALIVE_URL) {
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
      }

      // Generated static files under /_frsh/ .
      if (url.pathname.startsWith(`${INTERNAL_PREFIX}/`)) {
      }
      return await withMiddlewares(req, connInfo, inner);
    };
  }

  async buildSnapshot() {
    // TODO: Backport
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
        snapshot,
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
      if (this.#dev) imports.push(DEV_CLIENT_URL);
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
}

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
