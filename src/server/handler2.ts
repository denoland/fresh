import { ASSET_CACHE_BUST_KEY, INTERNAL_PREFIX } from "../runtime/utils.ts";
import { BUILD_ID } from "./build_id.ts";
import { ALIVE_URL, JS_PREFIX, REFRESH_JS_URL } from "./constants.ts";
import { JsBuild, ServerContextInner, StaticFile } from "./context2.ts";
import {
  ConnInfo,
  extname,
  RequestHandler,
  Status,
  typeByExtension,
} from "./deps.ts";
import { Handler, HandlerContext, MiddlewareHandler } from "./mod.ts";
import {
  KnownMethod,
  ManyRouterRoute,
  RouterRoute,
  URLManyRouter,
  URLRouter,
} from "./router2.ts";
import {
  ErrorPage,
  MiddlewareHandlerContext,
  RenderOptions,
  Route,
  UnknownPage,
} from "./types.ts";
import { render as internalRender } from "./render.ts";
import { ContentSecurityPolicyDirectives, SELF } from "../runtime/csp.ts";
import { DestinationKind } from "./router.ts";

export function buildHandler(ctx: ServerContextInner): RequestHandler {
  const router = new URLRouter(routes(ctx));
  const middlewareRouter = new URLManyRouter(middlewareRoutes(ctx));

  return function handler(
    req: Request,
    connInfo: ConnInfo,
  ): Response | Promise<Response> {
    // Redirect requests that end with a trailing slash to their non-trailing
    // slash counterpart.
    // Ex: /about/ -> /about
    const url = new URL(req.url);
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      // Remove trailing slashes
      const path = url.pathname.replace(/\/+$/, "");
      const location = `${path}${url.search}`;
      return new Response(null, {
        status: Status.TemporaryRedirect,
        headers: { location },
      });
    }

    const match = router.match(req.url, req.method);
    const middlewares = middlewareRouter.matchAll(req.url);

    const state: Record<string, unknown> = {};

    const middlewareCtx: MiddlewareHandlerContext = {
      next() {
        const mw = middlewares[0];
        const handler = mw?.[0].handlers.shift();
        if (handler) {
          if (mw[0].handlers.length === 0) middlewares.shift();
          return Promise.resolve(handler(req, middlewareCtx));
        }
        const rctx = {
          get localAddr() {
            return connInfo.localAddr;
          },
          get remoteAddr() {
            return connInfo.remoteAddr;
          },
          state,
        };
        if (match) {
          return Promise.resolve(
            match[0].handler(
              req,
              rctx,
              match[1].pathname.groups as Record<string, string>,
            ),
          );
        } else {
        }
        throw "todo: 404";
      },
      get localAddr() {
        return connInfo.localAddr;
      },
      get remoteAddr() {
        return connInfo.remoteAddr;
      },
      state,
      destination: match?.[0].destination ?? "notFound",
    };

    return middlewareCtx.next();
  };
}

interface RouterContext extends ConnInfo {
  state: Record<string, unknown>;
}

interface RouterHandler {
  handler: (
    req: Request,
    rctx: RouterContext,
    params: Record<string, string>,
  ) => Response | Promise<Response>;
  destination: DestinationKind;
}

function routes(ctx: ServerContextInner): RouterRoute<RouterHandler>[] {
  const routes: RouterRoute<RouterHandler>[] = [];

  routes.push(internalJSRoute(ctx.build));
  if (ctx.dev) routes.push(refreshJsRoute(), aliveUrlRoute());
  routes.push(...staticFileRoutes(ctx.staticFiles));
  routes.push(...pageRoutes(ctx));

  return routes;
}

function internalJSRoute(build: JsBuild): RouterRoute<RouterHandler> {
  const pattern = new URLPattern({
    pathname: `${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}/:path*`,
  });
  const methods = new Map<KnownMethod, RouterHandler>();

  methods.set("HEAD", {
    destination: "internal",
    async handler(_req, _rctx, params) {
      const snapshot = await build.snapshot();
      const exists = snapshot.paths.includes(params.path);
      if (!exists) return new Response(null, { status: Status.NotFound });

      const headers: Record<string, string> = {
        "Cache-Control": "public, max-age=604800, immutable",
      };
      const contentType = typeByExtension(extname(params.path));
      if (contentType) headers["Content-Type"] = contentType;

      return new Response(null, {
        status: Status.OK,
        headers,
      });
    },
  });

  methods.set("GET", {
    destination: "internal",
    async handler(_req, _rctx, params) {
      const snapshot = await build.snapshot();
      const contents = snapshot.read(params.path);
      if (contents === null) return new Response(null, { status: 404 });

      const headers: Record<string, string> = {
        "Cache-Control": "public, max-age=604800, immutable",
      };
      const contentType = typeByExtension(extname(params.path));
      if (contentType) headers["Content-Type"] = contentType;

      return new Response(contents, {
        status: Status.OK,
        headers,
      });
    },
  });

  return { pattern, methods };
}

function refreshJsRoute(): RouterRoute<RouterHandler> {
  const script = `let es = new EventSource("${ALIVE_URL}");
  window.addEventListener("beforeunload", (event) => {
    es.close();
  });
  es.addEventListener("message", function listener(e) {
    if (e.data !== "${BUILD_ID}") {
      this.removeEventListener("message", listener);
      location.reload();
    }
  });`;

  const pattern = new URLPattern({ pathname: REFRESH_JS_URL });
  const methods = new Map<KnownMethod, RouterHandler>();
  methods.set("HEAD", {
    destination: "internal",
    handler() {
      return new Response(null, {
        headers: { "content-type": "application/javascript; charset=utf-8" },
      });
    },
  });
  methods.set("GET", {
    destination: "internal",
    handler() {
      return new Response(script, {
        headers: { "content-type": "application/javascript; charset=utf-8" },
      });
    },
  });
  return { pattern, methods };
}

function aliveUrlRoute(): RouterRoute<RouterHandler> {
  const pattern = new URLPattern({ pathname: REFRESH_JS_URL });
  const methods = new Map<KnownMethod, RouterHandler>();
  methods.set("HEAD", {
    destination: "internal",
    handler() {
      return new Response(null, {
        headers: { "content-type": "text/event-stream" },
      });
    },
  });
  methods.set("GET", {
    destination: "internal",
    handler() {
      let timerId: number | undefined = undefined;
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(`data: ${BUILD_ID}\nretry: 100\n\n`);
          timerId = setInterval(() => {
            controller.enqueue(`data: ${BUILD_ID}\n\n`);
          }, 1000);
        },
        cancel() {
          if (timerId !== undefined) clearInterval(timerId);
        },
      });
      return new Response(body.pipeThrough(new TextEncoderStream()), {
        headers: { "content-type": "text/event-stream" },
      });
    },
  });
  return { pattern, methods };
}

function staticFileRoutes(
  staticFiles: StaticFile[],
): RouterRoute<RouterHandler>[] {
  const routes: RouterRoute<RouterHandler>[] = [];

  for (const file of staticFiles) {
    const route = sanitizePathToRegex(file.path);
    const pattern = new URLPattern({ pathname: route });
    const methods = new Map<KnownMethod, RouterHandler>();

    // deno-lint-ignore no-inner-declarations
    async function handler(
      req: Request,
      body: () => Promise<ReadableStream<Uint8Array>> | null,
    ): Promise<Response> {
      const url = new URL(req.url);
      const key = url.searchParams.get(ASSET_CACHE_BUST_KEY);
      if (key !== null && BUILD_ID !== key) {
        url.searchParams.delete(ASSET_CACHE_BUST_KEY);
        const location = url.pathname + url.search;
        return new Response(null, {
          status: Status.Found,
          headers: {
            location,
          },
        });
      }

      const headers = new Headers({
        "content-type": file.contentType,
        etag: file.etag,
        vary: "If-None-Match",
      });
      if (key !== null) {
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
      }
      const ifNoneMatch = req.headers.get("if-none-match");
      if (ifNoneMatch === file.etag || ifNoneMatch === "W/" + file.etag) {
        return new Response(null, { status: Status.NotModified, headers });
      } else {
        headers.set("content-length", String(file.size));
        const b = await body();
        return new Response(b, { status: Status.OK, headers });
      }
    }

    methods.set("HEAD", {
      destination: "static",
      handler: (req) => handler(req, () => null),
    });
    methods.set("GET", {
      destination: "static",
      handler: (req) =>
        handler(req, async () => {
          const fsFile = await Deno.open(file.localUrl);
          return fsFile.readable;
        }),
    });

    routes.push({ pattern, methods });
  }

  return routes;
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

interface RouterMiddlewareHandler {
  handlers: MiddlewareHandler[];
  pattern: string;
}

function middlewareRoutes(
  ctx: ServerContextInner,
): ManyRouterRoute<RouterMiddlewareHandler>[] {
  return ctx.middlewares.map((r) => ({
    pattern: r.compiledPattern,
    handler: { handlers: r.handlers, pattern: r.pattern },
  }));
}

function createRender<Data = undefined>(
  ctx: ServerContextInner,
  route: Route<Data> | UnknownPage | ErrorPage,
  status: number,
  req: Request,
  params: Record<string, string>,
  error?: unknown,
) {
  return async (data?: Data, options?: RenderOptions) => {
    if (route.component === undefined) {
      throw new Error("This page does not have a component to render.");
    }
    const resp = await internalRender({
      route,
      islands: ctx.islands,
      plugins: ctx.plugins,
      app: ctx.appPage,
      imports: ctx.dev ? [REFRESH_JS_URL] : [],
      dependenciesFn: (path) => {
        const snapshot = ctx.build.maybeSnapshot();
        return snapshot?.dependencies(path) ?? [];
      },
      renderFn: ctx.legacyRenderFn,
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
      if (ctx.dev) {
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
    return new Response(body, {
      status: options?.status ?? status,
      statusText: options?.statusText,
      headers: options?.headers ? { ...headers, ...options.headers } : headers,
    });
  };
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

function wrapHandler(
  ctx: ServerContextInner,
  route: Route,
  inner: Handler,
): RouterHandler {
  return {
    destination: "route",
    handler(req, rctx, params) {
      const hctx: HandlerContext = {
        get localAddr() {
          return rctx.localAddr;
        },
        get remoteAddr() {
          return rctx.remoteAddr;
        },
        params,
        state: rctx.state,
        get render() {
          return createRender(ctx, route, 200, req, params);
        },
        get renderNotFound() {
          return createRender(ctx, ctx.notFoundPage, 404, req, params);
        },
      };
      return inner(req, hctx);
    },
  };
}

function pageRoutes(ctx: ServerContextInner): RouterRoute<RouterHandler>[] {
  const routes: RouterRoute<RouterHandler>[] = [];

  for (const route of ctx.routes) {
    const methods: Map<KnownMethod, RouterHandler> = new Map();
    let default_: RouterHandler | undefined;

    if (typeof route.handler === "function") {
      default_ = wrapHandler(ctx, route, route.handler);
    } else {
      for (const [method, handler] of Object.entries(route.handler)) {
        const knownMethod = method as KnownMethod;
        methods.set(knownMethod, wrapHandler(ctx, route, handler));
      }
    }

    routes.push({
      pattern: new URLPattern({ pathname: route.pattern }),
      methods,
      default: default_,
    });
  }

  return routes;
}
