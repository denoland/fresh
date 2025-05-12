import * as path from "@std/path";
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
import type { ServerIslandRegistry } from "./context.ts";
import { FinishSetup, ForgotBuild } from "./finish_setup.tsx";
import { HttpError } from "./error.ts";
import { mergePaths } from "./utils.ts";

// TODO: Completed type clashes in older Deno versions
// deno-lint-ignore no-explicit-any
export const DEFAULT_CONN_INFO: any = {
  localAddr: { transport: "tcp", hostname: "localhost", port: 8080 },
  remoteAddr: { transport: "tcp", hostname: "localhost", port: 1234 },
};

const DEFAULT_NOT_FOUND = () => {
  throw new HttpError(404);
};
const DEFAULT_NOT_ALLOWED_METHOD = () => {
  throw new HttpError(405);
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
    // deno-lint-ignore no-console
    console.log(`    ${localLabel}  ${space}${address}${sep}`);
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

export let getRouter: <State>(app: App<State>) => Router<MiddlewareFn<State>>;
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

  static {
    getRouter = (app) => app.#router;
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
      ? path.basename(filePath, path.extname(filePath))
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

  use(middleware: MiddlewareFn<State>): this {
    this.#router.addMiddleware(middleware);
    return this;
  }

  get(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    return this.#addRoutes("GET", path, middlewares);
  }
  post(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    return this.#addRoutes("POST", path, middlewares);
  }
  patch(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    return this.#addRoutes("PATCH", path, middlewares);
  }
  put(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    return this.#addRoutes("PUT", path, middlewares);
  }
  delete(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    return this.#addRoutes("DELETE", path, middlewares);
  }
  head(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    return this.#addRoutes("HEAD", path, middlewares);
  }
  all(path: string, ...middlewares: MiddlewareFn<State>[]): this {
    return this.#addRoutes("ALL", path, middlewares);
  }

  mountApp(path: string, app: App<State>): this {
    const routes = app.#router._routes;
    app.#islandRegistry.forEach((value, key) => {
      this.#islandRegistry.set(key, value);
    });

    const middlewares = app.#router._middlewares;

    // Special case when user calls one of these:
    // - `app.mountApp("/", otherApp)`
    // - `app.mountApp("/*", otherApp)`
    const isSelf = path === "/*" || path === "/";
    if (isSelf && middlewares.length > 0) {
      this.#router._middlewares.push(...middlewares);
    }

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];

      const merged = typeof route.path === "string"
        ? mergePaths(path, route.path)
        : route.path;
      const combined = isSelf
        ? route.handlers
        : middlewares.concat(route.handlers);
      this.#router.add(route.method, merged, combined);
    }

    return this;
  }

  #addRoutes(
    method: Method | "ALL",
    pathname: string | URLPattern,
    middlewares: MiddlewareFn<State>[],
  ): this {
    const merged = typeof pathname === "string"
      ? mergePaths(this.config.basePath, pathname)
      : pathname;
    this.#router.add(method, merged, middlewares);
    return this;
  }

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
        : DEFAULT_NOT_FOUND;

      const { params, handlers, pattern } = matched;
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

      try {
        let result: unknown;
        if (handlers.length === 1 && handlers[0].length === 1) {
          result = await handlers[0][0](ctx);
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
        if (err instanceof HttpError) {
          if (err.status >= 500) {
            // deno-lint-ignore no-console
            console.error(err);
          }
          return new Response(err.message, { status: err.status });
        }

        // deno-lint-ignore no-console
        console.error(err);
        return new Response("Internal server error", { status: 500 });
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
