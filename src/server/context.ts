import { contentType, extname, SEPARATOR, STATUS_CODE } from "./deps.ts";
import * as router from "./router.ts";
import { FreshConfig, FreshContext, Manifest } from "./mod.ts";
import {
  ALIVE_URL,
  DEV_CLIENT_URL,
  DEV_ERROR_OVERLAY_URL,
  JS_PREFIX,
} from "./constants.ts";
import { BUILD_ID, DENO_DEPLOYMENT_ID } from "./build_id.ts";

import {
  ErrorPage,
  Handler,
  InternalFreshState,
  Island,
  Plugin,
  RenderFunction,
  RenderOptions,
  Route,
  ServeHandlerInfo,
  UnknownPage,
  UnknownRenderFunction,
} from "./types.ts";
import { render as internalRender } from "./render.ts";
import {
  ContentSecurityPolicy,
  ContentSecurityPolicyDirectives,
  SELF,
} from "../runtime/csp.ts";
import { ASSET_CACHE_BUST_KEY, INTERNAL_PREFIX } from "../runtime/utils.ts";
import { Builder, BuildSnapshot, EsbuildBuilder } from "../build/mod.ts";
import { setAllIslands } from "./rendering/preact_hooks.ts";
import { getCodeFrame } from "./code_frame.ts";
import { getInternalFreshState } from "./config.ts";
import {
  composeMiddlewares,
  ROOT_BASE_ROUTE,
  selectSharedRoutes,
  toBaseRoute,
} from "./compose.ts";
import { extractRoutes, FsExtractResult } from "./fs_extract.ts";
import { loadAotSnapshot } from "../build/aot_snapshot.ts";
import { ErrorOverlay } from "./error_overlay.tsx";
import { withBase } from "./router.ts";
import { PARTIAL_SEARCH_PARAM } from "../constants.ts";
import TailwindErrorPage from "./tailwind_aot_error_page.tsx";

const DEFAULT_CONN_INFO: ServeHandlerInfo = {
  localAddr: { transport: "tcp", hostname: "localhost", port: 8080 },
  remoteAddr: { transport: "tcp", hostname: "localhost", port: 1234 },
};

// deno-lint-ignore no-explicit-any
const NOOP_COMPONENT = () => null as any;
const NOOP_NEXT = () => Promise.resolve(new Response(null, { status: 500 }));

/**
 * @deprecated Use {@linkcode FromManifestConfig} instead
 */
export type FromManifestOptions = FromManifestConfig;

export type FromManifestConfig = FreshConfig & {
  dev?: boolean;
};

export async function getServerContext(state: InternalFreshState) {
  const { config, denoJson, denoJsonPath: configPath } = state;

  if (config.dev) {
    // Ensure that debugging hooks are set up for SSR rendering
    await import("preact/debug");
  }

  // Plugins are already instantiated in build mode
  if (!state.build) {
    await Promise.all(
      config.plugins.map((plugin) => plugin.configResolved?.(state.config)),
    );
  }

  const extractResult = await extractRoutes(state);

  // Restore snapshot if available
  let snapshot: Builder | BuildSnapshot | Promise<BuildSnapshot> | null = null;
  if (state.loadSnapshot) {
    const loadedSnapshot = await loadAotSnapshot(config);
    if (loadedSnapshot !== null) {
      snapshot = loadedSnapshot;
      state.didLoadSnapshot = true;
    }
  }

  const finalSnapshot = snapshot ?? new EsbuildBuilder({
    buildID: BUILD_ID,
    entrypoints: collectEntrypoints(
      config.dev,
      extractResult.islands,
      config.plugins,
    ),
    configPath,
    dev: config.dev,
    jsx: denoJson.compilerOptions?.jsx,
    jsxImportSource: denoJson.compilerOptions?.jsxImportSource,
    target: state.config.build.target,
    absoluteWorkingDir: Deno.cwd(),
    basePath: state.config.basePath,
  });

  return new ServerContext(
    state,
    extractResult,
    finalSnapshot,
  );
}

function redirectTo(pathOrUrl: string = "/", status = 302): Response {
  let location = pathOrUrl;

  // Disallow protocol relative URLs
  if (pathOrUrl !== "/" && pathOrUrl.startsWith("/")) {
    let idx = pathOrUrl.indexOf("?");
    if (idx === -1) {
      idx = pathOrUrl.indexOf("#");
    }

    const pathname = idx > -1 ? pathOrUrl.slice(0, idx) : pathOrUrl;
    const search = idx > -1 ? pathOrUrl.slice(idx) : "";

    // Remove double slashes to prevent open redirect vulnerability.
    location = `${pathname.replaceAll(/\/+/g, "/")}${search}`;
  }

  return new Response(null, {
    status,
    headers: {
      location,
    },
  });
}

export class ServerContext {
  #renderFn: RenderFunction;
  #plugins: Plugin[];
  #builder: Builder | Promise<BuildSnapshot> | BuildSnapshot;
  #state: InternalFreshState;
  #extractResult: FsExtractResult;
  #dev: boolean;
  #revision = 0;

  constructor(
    state: InternalFreshState,
    extractResult: FsExtractResult,
    snapshot: Builder | BuildSnapshot | Promise<BuildSnapshot>,
  ) {
    this.#state = state;
    this.#extractResult = extractResult;
    this.#renderFn = state.config.render;
    this.#plugins = state.config.plugins;
    this.#dev = state.config.dev;
    this.#builder = snapshot;
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
    const basePath = this.#state.config.basePath;
    const renderNotFound = createRenderNotFound(
      this.#extractResult,
      this.#dev,
      this.#plugins,
      this.#renderFn,
      this.#maybeBuildSnapshot(),
    );
    const handlers = this.#handlers(renderNotFound);
    const inner = router.router(handlers);
    const withMiddlewares = composeMiddlewares(
      this.#extractResult.middlewares,
      handlers.errorHandler,
      router.getParamsAndRoute(handlers),
      renderNotFound,
      basePath,
    );
    const trailingSlashEnabled = this.#state.config.router?.trailingSlash;
    const isDev = this.#dev;

    if (this.#dev) {
      this.#revision = Date.now();
    }

    // deno-lint-ignore no-this-alias
    const _self = this;

    return async function handler(
      req: Request,
      connInfo: ServeHandlerInfo = DEFAULT_CONN_INFO,
    ) {
      const url = new URL(req.url);
      // Syntactically having double slashes in the pathname is valid per
      // spec, but there is no behavior defined for that. Practically all
      // servers normalize the pathname of a URL to not include double
      // forward slashes.
      url.pathname = url.pathname.replaceAll(/\/+/g, "/");

      const aliveUrl = basePath + ALIVE_URL;

      if (isDev) {
        // Live reload: Send updates to browser
        if (url.pathname === aliveUrl) {
          if (req.headers.get("upgrade") !== "websocket") {
            return new Response(null, { status: 501 });
          }

          // TODO: When a change is made the Deno server restarts,
          // so for now the WebSocket connection is only used for
          // the client to know when the server is back up. Once we
          // have HMR we'll actively start sending messages back
          // and forth.
          const { response, socket } = Deno.upgradeWebSocket(req);

          socket.addEventListener("open", () => {
            socket.send(
              JSON.stringify({
                type: "initial-state",
                revision: _self.#revision,
              }),
            );
          });

          return response;
        } else if (
          url.pathname === withBase(DEV_CLIENT_URL, basePath) ||
          url.pathname === withBase(`${DEV_CLIENT_URL}.map`, basePath)
        ) {
          const bundlePath = (url.pathname.endsWith(".map"))
            ? "fresh_dev_client.js.map"
            : "fresh_dev_client.js";

          return _self.#bundleAssetRoute(bundlePath);
        }
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
          status: STATUS_CODE.TemporaryRedirect,
          headers: { location },
        });
      } else if (trailingSlashEnabled && !url.pathname.endsWith("/")) {
        // If the last element of the path has a "." it's a file
        const isFile = url.pathname.split("/").at(-1)?.includes(".");

        // If the path uses the internal prefix, don't redirect it
        const isInternal = url.pathname.startsWith(INTERNAL_PREFIX);

        if (!isFile && !isInternal) {
          url.pathname += "/";
          return Response.redirect(url, STATUS_CODE.PermanentRedirect);
        }
      }

      // Redirect to base path if not present in url
      if (basePath && !url.pathname.startsWith(basePath)) {
        const to = new URL(basePath + url.pathname, url.origin);
        return Response.redirect(to, 302);
      }

      const ctx: FreshContext = {
        url,
        params: {},
        config: _self.#state.config,
        basePath: _self.#state.config.basePath,
        localAddr: connInfo.localAddr,
        remoteAddr: connInfo.remoteAddr,
        state: {},
        isPartial: url.searchParams.has(PARTIAL_SEARCH_PARAM),
        destination: "route",
        error: undefined,
        codeFrame: undefined,
        Component: NOOP_COMPONENT,
        next: NOOP_NEXT,
        render: NOOP_NEXT,
        renderNotFound: async (data) => {
          ctx.data = data;
          return await renderNotFound(req, ctx);
        },
        redirect: redirectTo,
        route: "",
        get pattern() {
          return ctx.route;
        },
        data: undefined,
      };

      return await withMiddlewares(req, ctx, inner);
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
   * This function returns all routes required by Fresh as an extended
   * path-to-regex, to handler mapping.
   */
  #handlers(
    renderNotFound: UnknownRenderFunction,
  ): {
    internalRoutes: router.Routes;
    staticRoutes: router.Routes;
    routes: router.Routes;

    otherHandler: router.Handler;
    errorHandler: router.ErrorHandler;
  } {
    const internalRoutes: router.Routes = {};
    const staticRoutes: router.Routes = {};
    let routes: router.Routes = {};

    const assetRoute = withBase(
      `${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}/:path*`,
      this.#state.config.basePath,
    );
    internalRoutes[assetRoute] = {
      baseRoute: toBaseRoute(assetRoute),
      methods: {
        default: (_req, ctx) => this.#bundleAssetRoute(ctx.params.path),
      },
    };

    // Add the static file routes.
    // each files has 2 static routes:
    // - one serving the file at its location without a "cache bursting" mechanism
    // - one containing the BUILD_ID in the path that can be cached
    for (
      const { localUrl, path, size, contentType, etag } of this.#extractResult
        .staticFiles
    ) {
      staticRoutes[path.replaceAll(SEPARATOR, "/")] = {
        baseRoute: toBaseRoute(path),
        methods: {
          "HEAD": this.#staticFileHandler(
            localUrl,
            size,
            contentType,
            etag,
          ),
          "GET": this.#staticFileHandler(
            localUrl,
            size,
            contentType,
            etag,
          ),
        },
      };
    }

    // Tell renderer about all globally available islands
    setAllIslands(this.#extractResult.islands);

    const dependenciesFn = (path: string) => {
      const snapshot = this.#maybeBuildSnapshot();
      return snapshot?.dependencies(path) ?? [];
    };

    const genRender = <Data = undefined>(
      route: Route<Data> | UnknownPage | ErrorPage,
      status: number,
    ) => {
      const imports: string[] = [];
      if (this.#dev) imports.push(this.#state.config.basePath + DEV_CLIENT_URL);
      return (
        req: Request,
        ctx: FreshContext,
        error?: unknown,
        codeFrame?: string,
      ) => {
        return async (data?: Data, options?: RenderOptions) => {
          if (route.component === undefined) {
            throw new Error("This page does not have a component to render.");
          }
          const layouts = selectSharedRoutes(
            route.baseRoute,
            this.#extractResult.layouts,
          );

          ctx.error = error;
          ctx.data = data;
          const resp = await internalRender({
            request: req,
            context: ctx,
            route,
            plugins: this.#plugins,
            app: this.#extractResult.app,
            layouts,
            imports,
            dependenciesFn,
            renderFn: this.#renderFn,
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

    for (const route of this.#extractResult.routes) {
      if (
        this.#state.config.router?.trailingSlash && route.pattern != "/"
      ) {
        route.pattern += "/";
      }
      const createRender = genRender(route, STATUS_CODE.OK);
      if (typeof route.handler === "function") {
        routes[route.pattern] = {
          baseRoute: route.baseRoute,
          methods: {
            default: (req, ctx) => {
              ctx.render = createRender(req, ctx);
              return (route.handler as Handler)(req, ctx);
            },
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
          ) => {
            ctx.render = createRender(req, ctx);
            return handler(req, ctx);
          };
        }
      }
    }

    let otherHandler: router.Handler = (req, ctx) => {
      ctx.render = (data) => {
        ctx.data = data;
        return renderNotFound(req, ctx);
      };
      return this.#extractResult.notFound.handler(req, ctx);
    };

    const errorHandlerRender = genRender(
      this.#extractResult.error,
      STATUS_CODE.InternalServerError,
    );
    const errorHandler: router.ErrorHandler = async (
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

      ctx.error = error;
      ctx.render = errorHandlerRender(req, ctx, error, codeFrame);
      return this.#extractResult.error.handler(req, ctx);
    };

    if (this.#dev) {
      const devErrorUrl = withBase(
        DEV_ERROR_OVERLAY_URL,
        this.#state.config.basePath,
      );
      const baseRoute = toBaseRoute(devErrorUrl);
      internalRoutes[devErrorUrl] = {
        baseRoute,
        methods: {
          default: async (req, ctx) => {
            const resp = await internalRender({
              request: req,
              context: ctx,
              route: {
                component: ErrorOverlay,
                inheritLayouts: false,
                appWrapper: false,
                csp: false,
                url: req.url,
                name: "error overlay route",
                handler: (_req: Request, ctx: FreshContext) => ctx.render(),
                baseRoute,
                pattern: baseRoute,
              },
              plugins: this.#plugins,
              app: this.#extractResult.app,
              layouts: [],
              imports: [],
              dependenciesFn: () => [],
              renderFn: this.#renderFn,
              codeFrame: undefined,
            });

            if (resp instanceof Response) {
              return resp;
            }

            return sendResponse(resp, {
              status: 200,
              isDev: this.#dev,
              statusText: undefined,
              headers: undefined,
            });
          },
        },
      };
    }

    // This page is shown when the user uses the tailwindcss plugin and
    // hasn't configured AOT builds.
    if (
      !this.#state.config.dev &&
      this.#state.loadSnapshot && !this.#state.didLoadSnapshot &&
      this.#state.config.plugins.some((plugin) => plugin.name === "tailwind")
    ) {
      if (DENO_DEPLOYMENT_ID !== undefined) {
        // Don't fail hard here and instead rewrite all routes to a special
        // error route. Otherwise the first user experience of deploying a
        // Fresh project would be pretty disruptive
        console.error(
          "%cError: Ahead of time builds not configured but required by the tailwindcss plugin.\nTo resolve this error, set up ahead of time builds: https://fresh.deno.dev/docs/concepts/ahead-of-time-builds",
          "color: red",
        );
        console.log();

        // Clear all routes so that everything redirects to the tailwind
        // error page.
        routes = {};

        const freshErrorPage = genRender({
          appWrapper: false,
          inheritLayouts: false,
          component: TailwindErrorPage,
          csp: false,
          name: "tailwind_error_route",
          pattern: "*",
          url: "",
          baseRoute: toBaseRoute("*"),
          handler: (_req: Request, ctx: FreshContext) => ctx.render(),
        }, STATUS_CODE.InternalServerError);
        otherHandler = (req, ctx) => {
          const render = freshErrorPage(req, ctx);
          return render();
        };
      } else {
        // Not on Deno Deploy. The user likely forgot to run `deno task build`
        console.warn(
          '%cNo pre-compiled tailwind styles found.\n\nDid you forget to run "deno task build" prior to starting the production server?',
          "color: yellow",
        );
      }
    }

    return { internalRoutes, staticRoutes, routes, otherHandler, errorHandler };
  }

  #staticFileHandler(
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
        return redirectTo(location, 307);
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
      } else if (req.method === "HEAD") {
        headers.set("content-length", String(size));
        return new Response(null, { status: 200, headers });
      } else {
        const file = await Deno.open(localUrl);
        headers.set("content-length", String(size));
        return new Response(file.readable, { headers });
      }
    };
  }

  async #bundleAssetRoute(filePath: string) {
    const snapshot = await this.buildSnapshot();
    const contents = await snapshot.read(filePath);
    if (!contents) return new Response(null, { status: 404 });

    const headers: Record<string, string> = {
      "Cache-Control": this.#dev
        ? "no-cache, no-store, max-age=0, must-revalidate"
        : "public, max-age=604800, immutable",
    };

    const type = contentType(extname(filePath));
    if (type) headers["Content-Type"] = type;

    return new Response(contents, {
      status: 200,
      headers,
    });
  }
}

const createRenderNotFound = (
  extractResult: FsExtractResult,
  dev: boolean,
  plugins: Plugin<Record<string, unknown>>[],
  renderFunction: RenderFunction,
  buildSnapshot: BuildSnapshot | null,
): UnknownRenderFunction => {
  const dependenciesFn = (path: string) => {
    const snapshot = buildSnapshot;
    return snapshot?.dependencies(path) ?? [];
  };

  return async (req, ctx) => {
    const notFound = extractResult.notFound;
    if (!notFound.component) {
      return sendResponse(["Not found.", "", undefined], {
        status: STATUS_CODE.NotFound,
        isDev: dev,
        statusText: undefined,
        headers: undefined,
      });
    }

    const layouts = selectSharedRoutes(
      ROOT_BASE_ROUTE,
      extractResult.layouts,
    );

    const imports: string[] = [];
    const resp = await internalRender({
      request: req,
      context: ctx,
      route: notFound,
      plugins: plugins,
      app: extractResult.app,
      layouts,
      imports,
      dependenciesFn,
      renderFn: renderFunction,
    });

    if (resp instanceof Response) {
      return resp;
    }

    return sendResponse(resp, {
      status: STATUS_CODE.NotFound,
      isDev: dev,
      statusText: undefined,
      headers: undefined,
    });
  };
};

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

  if (dev) {
    entryPoints.fresh_dev_client = import.meta.resolve(
      `${entrypointBase}/client.ts`,
    );
  }

  try {
    import.meta.resolve("@preact/signals");
    entryPoints.signals = import.meta.resolve(`${entrypointBase}/signals.ts`);
  } catch {
    // @preact/signals is not in the import map
  }

  for (const island of islands) {
    entryPoints[`island-${island.name}`] = island.url;
  }

  for (const plugin of plugins) {
    for (const [name, url] of Object.entries(plugin.entrypoints ?? {})) {
      entryPoints[`plugin-${plugin.name}-${name}`] = url;
    }
  }

  return entryPoints;
}

function sendResponse(
  resp: [string, string, ContentSecurityPolicy | undefined],
  options: {
    status: number;
    statusText: string | undefined;
    headers?: HeadersInit;
    isDev: boolean;
  },
) {
  const [body, uuid, csp] = resp;
  const headers: Headers = new Headers({
    "content-type": "text/html; charset=utf-8",
    "x-fresh-uuid": uuid,
  });

  if (csp) {
    if (options.isDev) {
      csp.directives.connectSrc = [
        ...(csp.directives.connectSrc ?? []),
        SELF,
      ];
    }
    const directive = serializeCSPDirectives(csp.directives);
    if (csp.reportOnly) {
      headers.set("content-security-policy-report-only", directive);
    } else {
      headers.set("content-security-policy", directive);
    }
  }

  if (options.headers) {
    if (Array.isArray(options.headers)) {
      for (const [key, value] of options.headers) {
        headers.append(key, value);
      }
    } else if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers.append(key, value);
      });
    } else {
      for (const [key, value] of Object.entries(options.headers)) {
        headers.append(key, value);
      }
    }
  }

  return new Response(body, {
    status: options.status,
    statusText: options.statusText,
    headers,
  });
}
