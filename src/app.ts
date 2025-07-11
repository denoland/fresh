import { type ComponentType, h } from "preact";
import { renderToString } from "preact-render-to-string";
import { trace } from "@opentelemetry/api";

import { DENO_DEPLOYMENT_ID } from "./runtime/build_id.ts";
import * as colors from "@std/fmt/colors";
import { type MiddlewareFn, runMiddlewares } from "./middlewares/mod.ts";
import { Context, getInternals, type ServerIslandRegistry } from "./context.ts";
import { type Method, type Router, UrlPatternRouter } from "./router.ts";
import {
  type FreshConfig,
  normalizeConfig,
  type ResolvedFreshConfig,
} from "./config.ts";
import { type BuildCache, ProdBuildCache } from "./build_cache.ts";
import { FinishSetup, ForgotBuild } from "./finish_setup.tsx";
import { HttpError } from "./error.ts";
import { pathToExportName } from "./utils.ts";
import type { Route } from "./types.ts";
import { isHandlerByMethod, type PageResponse } from "./handlers.ts";

// TODO: Completed type clashes in older Deno versions
// deno-lint-ignore no-explicit-any
export const DEFAULT_CONN_INFO: any = {
  localAddr: { transport: "tcp", hostname: "localhost", port: 8080 },
  remoteAddr: { transport: "tcp", hostname: "localhost", port: 1234 },
};

const DEFAULT_RENDER = () => ({ data: {} });

const DEFAULT_NOT_FOUND = (): Promise<Response> => {
  throw new HttpError(404);
};
const DEFAULT_NOT_ALLOWED_METHOD = (): Promise<Response> => {
  throw new HttpError(405);
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
  #errorMiddleware: MiddlewareFn<State> | null = null;
  #notFoundMiddleware: MiddlewareFn<State> | null = null;

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

    this.#addMiddleware("ALL", path, fns);

    return this;
  }

  notFound(routeOrMiddleware: Route<State> | MiddlewareFn<State>): this {
    const handler = typeof routeOrMiddleware === "function"
      ? routeOrMiddleware
      : routeToMiddleware(routeOrMiddleware!);

    this.#notFoundMiddleware = handler;
    return this;
  }

  error(
    routeOrMiddleware: Route<State> | MiddlewareFn<State>,
  ): this;
  error(
    path: string,
    routeOrMiddleware: Route<State> | MiddlewareFn<State>,
  ): this;
  error(
    pathOrRouteMiddleware: string | Route<State> | MiddlewareFn<State>,
    routeOrMiddleware?: Route<State> | MiddlewareFn<State>,
  ): this {
    let path = "*";
    if (typeof pathOrRouteMiddleware === "string") {
      path = pathOrRouteMiddleware;
    } else {
      routeOrMiddleware = pathOrRouteMiddleware;
    }

    const handler = typeof routeOrMiddleware === "function"
      ? routeOrMiddleware
      : routeToMiddleware(routeOrMiddleware!);

    const fn: MiddlewareFn<State> = async (ctx) => {
      const internals = getInternals(ctx);
      const { app: prevApp, layouts: prevLayouts } = internals;

      try {
        return await ctx.next();
      } catch (err) {
        internals.app = prevApp;
        internals.layouts = prevLayouts;

        if (
          this.#notFoundMiddleware !== null && err instanceof HttpError &&
          err.status === 404
        ) {
          throw err;
        }

        return await handler(ctx);
      }
    };

    if (path === "*") {
      this.#errorMiddleware = fn;
    } else {
      this.#router.add("ALL", path, fn);
    }

    return this;
  }

  route(path: string, route: Route<State>): this {
    const fn = routeToMiddleware(route);
    this.#router.add("ALL", path, fn);

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

  // TODO: Deprecate in favor of .use()
  all(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    return this.use(path, ...middlewares);
  }

  #addMiddleware(
    method: Method | "ALL",
    path: string,
    fns: MiddlewareFn<State>[],
  ) {
    for (let i = 0; i < fns.length; i++) {
      this.#router.add(method, path, fns[i]);
    }
  }

  mountApp(path: string, app: App<State>): this {
    // const segment = path === "*" || path === "/*"
    //   ? this.#root
    //   : findOrCreateSegment(this.#root, path);

    // const root = app.#root;
    // if (root.app) segment.app = root.app;
    // if (root.layout) segment.layout = root.layout;
    // if (root.error) {
    //   root.error.parent = segment;
    //   segment.error = root.error;
    // }
    // if (root.error404) {
    //   root.error404.parent = segment;
    //   segment.error404 = root.error404;
    // }

    // if (root.middlewares.length > 0) {
    //   segment.middlewares.push(...root.middlewares);
    // }

    // if (root.children.size > 0) {
    //   root.children.forEach((value, key) => {
    //     const clone = { ...value };
    //     clone.parent = segment;
    //     segment.children.set(key, clone);
    //   });
    // }
    // if (root.routes.size > 0) {
    //   root.routes.forEach((value, key) => {
    //     const clone = { ...value };
    //     clone.parent = segment;
    //     segment.routes.set(key, clone);
    //   });
    // }

    app.#islandRegistry.forEach((value, key) => {
      this.#islandRegistry.set(key, value);
    });

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

    if (this.#errorMiddleware === null && this.#notFoundMiddleware !== null) {
      this.#errorMiddleware = async (ctx) => {
        try {
          return await ctx.next();
        } catch (err) {
          if (
            this.#notFoundMiddleware !== null && err instanceof HttpError &&
            err.status === 404
          ) {
            return await this.#notFoundMiddleware(ctx);
          }

          throw err;
        }
      };
    }

    const initHandlers: MiddlewareFn<State>[] = this.#errorMiddleware !== null
      ? [this.#errorMiddleware]
      : [];

    return async (
      req: Request,
      conn: Deno.ServeHandlerInfo = DEFAULT_CONN_INFO,
    ) => {
      const url = new URL(req.url);
      // Prevent open redirect attacks
      url.pathname = url.pathname.replace(/\/+/g, "/");

      const method = req.method.toUpperCase() as Method;
      const matched = this.#router.match(method, url, initHandlers);
      const { params, pattern, handlers } = matched;

      const span = trace.getActiveSpan();
      if (span && pattern) {
        span.updateName(`${method} ${pattern}`);
        span.setAttribute("http.route", pattern);
      }

      const next = matched.patternMatch && !matched.methodMatch
        ? DEFAULT_NOT_ALLOWED_METHOD
        : DEFAULT_NOT_FOUND;

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
        if (!matched.methodMatch && matched.pattern !== null) {
          handlers.push(DEFAULT_NOT_ALLOWED_METHOD);
        } else {
          if (this.#notFoundMiddleware !== null) {
            handlers.push(this.#notFoundMiddleware);
          }
          handlers.push(DEFAULT_NOT_FOUND);
        }

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

function routeToMiddleware<State>(route: Route<State>): MiddlewareFn<State> {
  const def = route.handler ?? DEFAULT_RENDER;

  return async function routeHandler(ctx) {
    const method = ctx.req.method as Method;

    let res: Response | PageResponse<unknown> | undefined;

    if (isHandlerByMethod(def)) {
      if (def.GET === undefined) {
        def.GET = DEFAULT_RENDER;
      }

      const fn = def[method];
      if (fn !== undefined) {
        res = await fn(ctx);
      }
    } else {
      res = await def(ctx);
    }

    if (res === undefined) {
      throw new Error(
        `Expected route handler to return a "Response" or page data, but got: ${res}`,
      );
    }

    if (res instanceof Response) {
      return res;
    }

    let status = 200;
    const headers = new Headers();

    if (typeof res.status === "number") {
      status = res.status;
    }
    if (res.headers) {
      for (const [name, value] of Object.entries(res.headers)) {
        if (value !== null && value !== undefined) {
          headers.set(name, String(value));
        } else {
          headers.delete(name);
        }
      }
    }

    if (route.component !== undefined) {
      ctx.setLayout(route.component, {
        skipAppWrapper: route.config?.skipAppWrapper,
        skipInheritedLayouts: route.config?.skipInheritedLayouts,
      });
    }

    return ctx.render(null, { headers, status });
  };
}
