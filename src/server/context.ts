import { extname, Status, typeByExtension } from "./deps.ts";
import * as router from "./router.ts";
import { FreshConfig, Manifest } from "./mod.ts";
import { ALIVE_URL, DEV_CLIENT_URL, JS_PREFIX } from "./constants.ts";
import { BUILD_ID } from "./build_id.ts";

import {
  ErrorPage,
  Handler,
  InternalFreshState,
  Island,
  Plugin,
  RenderFunction,
  RenderOptions,
  Route,
  RouterState,
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

const DEFAULT_CONN_INFO: ServeHandlerInfo = {
  localAddr: { transport: "tcp", hostname: "localhost", port: 8080 },
  remoteAddr: { transport: "tcp", hostname: "localhost", port: 1234 },
};

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

  const extractResult = await extractRoutes(state);

  // Restore snapshot if available
  let snapshot: Builder | BuildSnapshot | Promise<BuildSnapshot> | null = null;
  if (state.loadSnapshot) {
    const loadedSnapshot = await loadAotSnapshot(config);
    if (loadedSnapshot !== null) snapshot = loadedSnapshot;
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
  });

  return new ServerContext(
    state,
    extractResult,
    finalSnapshot,
  );
}

export class ServerContext {
  #renderFn: RenderFunction;
  #plugins: Plugin[];
  #builder: Builder | Promise<BuildSnapshot> | BuildSnapshot;
  #state: InternalFreshState;
  #extractResult: FsExtractResult;
  #dev: boolean;

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
    const renderNotFound = createRenderNotFound(
      this.#extractResult,
      this.#dev,
      this.#plugins,
      this.#renderFn,
      this.#maybeBuildSnapshot(),
    );
    const handlers = this.#handlers(renderNotFound);
    const inner = router.router<RouterState>(handlers);
    const withMiddlewares = composeMiddlewares(
      this.#extractResult.middlewares,
      handlers.errorHandler,
      router.getParamsAndRoute<RouterState>(handlers),
      renderNotFound,
    );
    const trailingSlashEnabled = this.#state.config.router?.trailingSlash;
    const isDev = this.#dev;
    const bundleAssetRoute = this.#bundleAssetRoute();

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
        } else if (url.pathname === DEV_CLIENT_URL) {
          return bundleAssetRoute(req, connInfo, { path: "client.js" });
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
   * This function returns all routes required by Fresh as an extended
   * path-to-regex, to handler mapping.
   */
  #handlers(
    renderNotFound: UnknownRenderFunction,
  ): {
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
      const { localUrl, path, size, contentType, etag } of this.#extractResult
        .staticFiles
    ) {
      const route = sanitizePathToRegex(path);
      staticRoutes[route] = {
        baseRoute: toBaseRoute(route),
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
          const layouts = selectSharedRoutes(
            route.baseRoute,
            this.#extractResult.layouts,
          );

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
            app: this.#extractResult.app,
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

    for (const route of this.#extractResult.routes) {
      if (
        this.#state.config.router?.trailingSlash && route.pattern != "/"
      ) {
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
      this.#extractResult.notFound.handler(
        req,
        {
          ...ctx,
          render() {
            return renderNotFound(req, {}, ctx);
          },
        },
      );

    const errorHandlerRender = genRender(
      this.#extractResult.error,
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

      return this.#extractResult.error.handler(
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

const createRenderNotFound = (
  extractResult: FsExtractResult,
  dev: boolean,
  plugins: Plugin<Record<string, unknown>>[],
  renderFunction: RenderFunction,
  buildSnapshot: BuildSnapshot | null,
) => {
  const dependenciesFn = (path: string) => {
    const snapshot = buildSnapshot;
    return snapshot?.dependencies(path) ?? [];
  };

  return async (
    ...args: Parameters<UnknownRenderFunction>
  ) => {
    const [req, params, ctx, data, error] = args;
    const notFound = extractResult.notFound;
    if (!notFound.component) {
      return sendResponse(["Not found.", undefined], {
        status: Status.NotFound,
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
    client: import.meta.resolve(`${entrypointBase}/client.ts`),
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
