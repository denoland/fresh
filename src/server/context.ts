import {
  ConnInfo,
  extname,
  fromFileUrl,
  RequestHandler,
  Status,
  toFileUrl,
  typeByExtension,
  walk,
} from "./deps.ts";
import { h } from "preact";
import * as router from "./router.ts";
import { Manifest } from "./mod.ts";
import { Bundler, JSXConfig } from "./bundle.ts";
import { ALIVE_URL, BUILD_ID, JS_PREFIX, REFRESH_JS_URL } from "./constants.ts";
import DefaultErrorHandler from "./default_error_page.ts";
import {
  AppModule,
  ErrorPage,
  ErrorPageModule,
  FreshOptions,
  Handler,
  Island,
  Middleware,
  MiddlewareHandlerContext,
  MiddlewareModule,
  MiddlewareRoute,
  Plugin,
  RenderFunction,
  Route,
  RouteModule,
  UnknownPage,
  UnknownPageModule,
} from "./types.ts";
import { render as internalRender } from "./render.ts";
import { ContentSecurityPolicyDirectives, SELF } from "../runtime/csp.ts";
import { ASSET_CACHE_BUST_KEY, INTERNAL_PREFIX } from "../runtime/utils.ts";
interface RouterState {
  state: Record<string, unknown>;
}

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

export class ServerContext {
  #dev: boolean;
  #routes: Route[];
  #islands: Island[];
  #staticFiles: StaticFile[];
  #bundler: Bundler;
  #renderFn: RenderFunction;
  #middlewares: MiddlewareRoute[];
  #app: AppModule;
  #notFound: UnknownPage;
  #error: ErrorPage;
  #plugins: Plugin[];

  constructor(
    routes: Route[],
    islands: Island[],
    staticFiles: StaticFile[],
    renderfn: RenderFunction,
    middlewares: MiddlewareRoute[],
    app: AppModule,
    notFound: UnknownPage,
    error: ErrorPage,
    plugins: Plugin[],
    importMapURL: URL,
    jsxConfig: JSXConfig,
  ) {
    this.#routes = routes;
    this.#islands = islands;
    this.#staticFiles = staticFiles;
    this.#renderFn = renderfn;
    this.#middlewares = middlewares;
    this.#app = app;
    this.#notFound = notFound;
    this.#error = error;
    this.#plugins = plugins;
    this.#dev = typeof Deno.env.get("DENO_DEPLOYMENT_ID") !== "string"; // Env var is only set in prod (on Deploy).
    this.#bundler = new Bundler(
      this.#islands,
      this.#plugins,
      importMapURL,
      jsxConfig,
      this.#dev,
    );
  }

  /**
   * Process the manifest into individual components and pages.
   */
  static async fromManifest(
    manifest: Manifest,
    opts: FreshOptions,
  ): Promise<ServerContext> {
    // Get the manifest' base URL.
    const baseUrl = new URL("./", manifest.baseUrl).href;

    const config = manifest.config || { importMap: "./import_map.json" };
    if (typeof config.importMap !== "string") {
      throw new Error("deno.json must contain an 'importMap' property.");
    }
    const importMapURL = new URL(config.importMap, manifest.baseUrl);

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
    let notFound: UnknownPage = DEFAULT_NOT_FOUND;
    let error: ErrorPage = DEFAULT_ERROR;
    for (const [self, module] of Object.entries(manifest.routes)) {
      const url = new URL(self, baseUrl).href;
      if (!url.startsWith(baseUrl + "routes")) {
        throw new TypeError("Page is not a child of the basepath.");
      }
      const path = url.substring(baseUrl.length).substring("routes".length);
      const baseRoute = path.substring(1, path.length - extname(path).length);
      const name = baseRoute.replace("/", "-");
      const isMiddleware = path.endsWith("/_middleware.tsx") ||
        path.endsWith("/_middleware.ts") || path.endsWith("/_middleware.jsx") ||
        path.endsWith("/_middleware.js");
      if (!path.startsWith("/_") && !isMiddleware) {
        const { default: component, config } = module as RouteModule;
        let pattern = pathToPattern(baseRoute);
        if (config?.routeOverride) {
          pattern = String(config.routeOverride);
        }
        let { handler } = module as RouteModule;
        handler ??= {};
        if (
          component &&
          typeof handler === "object" && handler.GET === undefined
        ) {
          handler.GET = (_req, { render }) => render();
        }
        const route: Route = {
          pattern,
          url,
          name,
          component,
          handler,
          csp: Boolean(config?.csp ?? false),
        };
        routes.push(route);
      } else if (isMiddleware) {
        middlewares.push({
          ...middlewarePathToPattern(baseRoute),
          ...module as MiddlewareModule,
        });
      } else if (
        path === "/_app.tsx" || path === "/_app.ts" ||
        path === "/_app.jsx" || path === "/_app.js"
      ) {
        app = module as AppModule;
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
          pattern: pathToPattern(baseRoute),
          url,
          name,
          component,
          handler: handler ?? ((req) => router.defaultOtherHandler(req)),
          csp: Boolean(config?.csp ?? false),
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
          pattern: pathToPattern(baseRoute),
          url,
          name,
          component,
          handler: handler ??
            ((req, ctx) => router.defaultErrorHandler(req, ctx, ctx.error)),
          csp: Boolean(config?.csp ?? false),
        };
      }
    }
    sortRoutes(routes);
    sortRoutes(middlewares);

    for (const [self, module] of Object.entries(manifest.islands)) {
      const url = new URL(self, baseUrl).href;
      if (!url.startsWith(baseUrl)) {
        throw new TypeError("Island is not a child of the basepath.");
      }
      const path = url.substring(baseUrl.length).substring("islands".length);
      const baseRoute = path.substring(1, path.length - extname(path).length);
      const name = sanitizeIslandName(baseRoute);
      const id = name.toLowerCase();
      if (typeof module.default !== "function") {
        throw new TypeError(
          `Islands must default export a component ('${self}').`,
        );
      }
      islands.push({ id, name, url, component: module.default });
    }

    const staticFiles: StaticFile[] = [];
    try {
      const staticFolder = new URL(
        opts.staticDir ?? "./static",
        manifest.baseUrl,
      );
      // TODO(lucacasonato): remove the extranious Deno.readDir when
      // https://github.com/denoland/deno_std/issues/1310 is fixed.
      for await (const _ of Deno.readDir(fromFileUrl(staticFolder))) {
        // do nothing
      }
      const entires = walk(fromFileUrl(staticFolder), {
        includeFiles: true,
        includeDirs: false,
        followSymlinks: false,
      });
      const encoder = new TextEncoder();
      for await (const entry of entires) {
        const localUrl = toFileUrl(entry.path);
        const path = localUrl.href.substring(staticFolder.href.length);
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
      if (err instanceof Deno.errors.NotFound) {
        // Do nothing.
      } else {
        throw err;
      }
    }

    return new ServerContext(
      routes,
      islands,
      staticFiles,
      opts.render ?? DEFAULT_RENDER_FN,
      middlewares,
      app,
      notFound,
      error,
      opts.plugins ?? [],
      importMapURL,
      jsxConfig,
    );
  }

  /**
   * This functions returns a request handler that handles all routes required
   * by fresh, including static files.
   */
  handler(): RequestHandler {
    const handlers = this.#handlers();
    const inner = router.router<RouterState>(handlers);
    const withMiddlewares = this.#composeMiddlewares(
      this.#middlewares,
      handlers.errorHandler,
    );
    return async function handler(req: Request, connInfo: ConnInfo) {
      // Redirect requests that end with a trailing slash to their non-trailing
      // slash counterpart.
      const url = new URL(req.url);
      if (cleanPathname(url)) {
        return Response.redirect(url.href, Status.TemporaryRedirect);
      }

      // HEAD requests should be handled as GET requests but without the body.
      const originalMethod = req.method;
      // Internally, HEAD is handled in the same way as GET.
      if (req.method === "HEAD") {
        req = new Request(req.url, { method: "GET", headers: req.headers });
      }
      const res = await withMiddlewares(req, connInfo, inner);
      if (originalMethod === "HEAD") {
        res.body?.cancel();
        return new Response(null, {
          headers: res.headers,
          status: res.status,
          statusText: res.statusText,
        });
      }
      return res;
    };
  }

  /**
   * Identify which middlewares should be applied for a request,
   * chain them and return a handler response
   */
  #composeMiddlewares(
    middlewares: MiddlewareRoute[],
    errorHandler: router.ErrorHandler<RouterState>,
  ) {
    return (
      req: Request,
      connInfo: ConnInfo,
      inner: router.FinalHandler<RouterState>,
    ) => {
      // identify middlewares to apply, if any.
      // middlewares should be already sorted from deepest to shallow layer
      const mws = selectMiddlewares(req.url, middlewares);

      const handlers: (() => Response | Promise<Response>)[] = [];

      const middlewareCtx: MiddlewareHandlerContext = {
        next() {
          const handler = handlers.shift()!;
          return Promise.resolve(handler());
        },
        ...connInfo,
        state: {},
        destination: "route",
      };

      for (const mw of mws) {
        if (mw.handler instanceof Array) {
          for (const handler of mw.handler) {
            handlers.push(() => handler(req, middlewareCtx));
          }
        } else {
          const handler = mw.handler;
          handlers.push(() => handler(req, middlewareCtx));
        }
      }

      const ctx = {
        ...connInfo,
        state: middlewareCtx.state,
      };
      const { destination, handler } = inner(
        req,
        ctx,
      );
      handlers.push(handler);
      middlewareCtx.destination = destination;
      return middlewareCtx.next().catch((e) => errorHandler(req, ctx, e));
    };
  }

  /**
   * This function returns all routes required by fresh as an extended
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
      default: this.#bundleAssetRoute(),
    };
    if (this.#dev) {
      internalRoutes[REFRESH_JS_URL] = {
        default: () => {
          return new Response(refreshJs(ALIVE_URL, BUILD_ID), {
            headers: {
              "content-type": "application/javascript; charset=utf-8",
            },
          });
        },
      };
      internalRoutes[ALIVE_URL] = {
        default: () => {
          let timerId: number | undefined = undefined;
          const body = new ReadableStream({
            start(controller) {
              controller.enqueue(`data: ${BUILD_ID}\nretry: 100\n\n`);
              timerId = setInterval(() => {
                controller.enqueue(`data: ${BUILD_ID}\n\n`);
              }, 1000);
            },
            cancel() {
              if (timerId !== undefined) {
                clearInterval(timerId);
              }
            },
          });
          return new Response(body.pipeThrough(new TextEncoderStream()), {
            headers: {
              "content-type": "text/event-stream",
            },
          });
        },
      };
    }

    // Add the static file routes.
    // each files has 2 static routes:
    // - one serving the file at its location without a "cache bursting" mechanism
    // - one containing the BUILD_ID in the path that can be cached
    for (
      const { localUrl, path, size, contentType, etag } of this.#staticFiles
    ) {
      const route = sanitizePathToRegex(path);
      staticRoutes[route] = {
        "GET": this.#staticFileHandler(
          localUrl,
          size,
          contentType,
          etag,
        ),
      };
    }

    const genRender = <Data = undefined>(
      route: Route<Data> | UnknownPage | ErrorPage,
      status: number,
    ) => {
      const imports: string[] = [];
      if (this.#dev) {
        imports.push(REFRESH_JS_URL);
      }
      return (
        req: Request,
        params: Record<string, string>,
        error?: unknown,
      ) => {
        return async (data?: Data) => {
          if (route.component === undefined) {
            throw new Error("This page does not have a component to render.");
          }

          if (
            typeof route.component === "function" &&
            route.component.constructor.name === "AsyncFunction"
          ) {
            throw new Error(
              "Async components are not supported. Fetch data inside of a route handler, as described in the docs: https://fresh.deno.dev/docs/getting-started/fetching-data",
            );
          }

          const preloads: string[] = [];
          const resp = await internalRender({
            route,
            islands: this.#islands,
            plugins: this.#plugins,
            app: this.#app,
            imports,
            preloads,
            renderFn: this.#renderFn,
            url: new URL(req.url),
            params,
            data,
            error,
          });

          const headers: Record<string, string> = {
            "content-type": "text/html; charset=utf-8",
          };

          const [body, csp] = resp;
          if (csp) {
            if (this.#dev) {
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
          return new Response(body, { status, headers });
        };
      };
    };

    const createUnknownRender = genRender(this.#notFound, Status.NotFound);

    for (const route of this.#routes) {
      const createRender = genRender(route, Status.OK);
      if (typeof route.handler === "function") {
        routes[route.pattern] = {
          default: (req, ctx, params) =>
            (route.handler as Handler)(req, {
              ...ctx,
              params,
              render: createRender(req, params),
              renderNotFound: createUnknownRender(req, {}),
            }),
        };
      } else {
        routes[route.pattern] = {};
        for (const [method, handler] of Object.entries(route.handler)) {
          routes[route.pattern][method as router.KnownMethod] = (
            req,
            ctx,
            params,
          ) =>
            handler(req, {
              ...ctx,
              params,
              render: createRender(req, params),
              renderNotFound: createUnknownRender(req, {}),
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
          render: createUnknownRender(req, {}),
        },
      );

    const errorHandlerRender = genRender(
      this.#error,
      Status.InternalServerError,
    );
    const errorHandler: router.ErrorHandler<RouterState> = (
      req,
      ctx,
      error,
    ) => {
      console.error(
        "%cAn error occurred during route handling or page rendering.",
        "color:red",
        error,
      );
      return this.#error.handler(
        req,
        {
          ...ctx,
          error,
          render: errorHandlerRender(req, {}, error),
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
   * Returns a router that contains all fresh routes. Should be mounted at
   * constants.INTERNAL_PREFIX
   */
  #bundleAssetRoute = (): router.MatchHandler => {
    return async (_req, _ctx, params) => {
      const path = `/${params.path}`;
      const file = await this.#bundler.get(path);
      let res;
      if (file) {
        const headers = new Headers({
          "Cache-Control": "public, max-age=604800, immutable",
        });

        const contentType = typeByExtension(extname(path));
        if (contentType) {
          headers.set("Content-Type", contentType);
        }

        res = new Response(file, {
          status: 200,
          headers,
        });
      }

      return res ?? new Response(null, {
        status: 404,
      });
    };
  };
}

const DEFAULT_RENDER_FN: RenderFunction = (_ctx, render) => {
  render();
};

const DEFAULT_APP: AppModule = {
  default: ({ Component }) => h(Component, {}),
};

const DEFAULT_NOT_FOUND: UnknownPage = {
  pattern: "",
  url: "",
  name: "_404",
  handler: (req) => router.defaultOtherHandler(req),
  csp: false,
};

const DEFAULT_ERROR: ErrorPage = {
  pattern: "",
  url: "",
  name: "_500",
  component: DefaultErrorHandler,
  handler: (_req, ctx) => ctx.render(),
  csp: false,
};

/**
 * Return a list of middlewares that needs to be applied for request url
 * @param url the request url
 * @param middlewares Array of middlewares handlers and their routes as path-to-regexp style
 */
export function selectMiddlewares(url: string, middlewares: MiddlewareRoute[]) {
  const selectedMws: Middleware[] = [];
  const reqURL = new URL(url);

  for (const { compiledPattern, handler } of middlewares) {
    const res = compiledPattern.exec(reqURL);
    if (res) {
      selectedMws.push({ handler });
    }
  }

  return selectedMws;
}

/**
 * Sort pages by their relative routing priority, based on the parts in the
 * route matcher
 */
function sortRoutes<T extends { pattern: string }>(routes: T[]) {
  routes.sort((a, b) => {
    const partsA = a.pattern.split("/");
    const partsB = b.pattern.split("/");
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i];
      const partB = partsB[i];
      if (partA === undefined) return -1;
      if (partB === undefined) return 1;
      if (partA === partB) continue;
      const priorityA = partA.startsWith(":") ? partA.endsWith("*") ? 0 : 1 : 2;
      const priorityB = partB.startsWith(":") ? partB.endsWith("*") ? 0 : 1 : 2;
      return Math.max(Math.min(priorityB - priorityA, 1), -1);
    }
    return 0;
  });
}

/** Transform a filesystem URL path to a `path-to-regex` style matcher. */
function pathToPattern(path: string): string {
  const parts = path.split("/");
  if (parts[parts.length - 1] === "index") {
    parts.pop();
  }
  const route = "/" + parts
    .map((part) => {
      if (part.startsWith("[...") && part.endsWith("]")) {
        return `:${part.slice(4, part.length - 1)}*`;
      }
      if (part.startsWith("[") && part.endsWith("]")) {
        return `:${part.slice(1, part.length - 1)}`;
      }
      return part;
    })
    .join("/");
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
  const fileName = name.replace("/", "");
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

export function middlewarePathToPattern(baseRoute: string) {
  baseRoute = baseRoute.slice(0, -"_middleware".length);
  let pattern = pathToPattern(baseRoute);
  if (pattern.endsWith("/")) {
    pattern = pattern.slice(0, -1) + "{/*}?";
  }
  const compiledPattern = new URLPattern({ pathname: pattern });
  return { pattern, compiledPattern };
}

function refreshJs(aliveUrl: string, buildId: string) {
  return `let es = new EventSource("${aliveUrl}");
window.addEventListener("beforeunload", (event) => {
  es.close();
});
es.addEventListener("message", function listener(e) {
  if (e.data !== "${buildId}") {
    this.removeEventListener("message", listener);
    location.reload();
  }
});`;
}

/**
 * Clean the pathname in the given URL by removing all trailing slashes.
 *
 * Returns true if the pathname was changed.
 */
export function cleanPathname(url: URL): boolean {
  const pathname = url.pathname.replace(/\/+$/, "");
  if (pathname === "") return false;
  if (pathname !== url.pathname) {
    url.pathname = pathname;
    return true;
  }
  return false;
}
