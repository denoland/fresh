import { DENO_DEPLOYMENT_ID } from "./constants.ts";
import * as colors from "@std/fmt/colors";
import { type MiddlewareFn, runMiddlewares } from "./middlewares/mod.ts";
import { FreshReqContext } from "./context.ts";
import {
  mergePaths,
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
import * as path from "@std/path";
import { type ComponentType, h } from "preact";
import type { ServerIslandRegistry } from "./context.ts";
import { renderToString } from "preact-render-to-string";
import { FinishSetup, ForgotBuild } from "./finish_setup.tsx";

export type ListenOptions = Partial<Deno.ServeTlsOptions> & {
  remoteAddress?: string;
};

export interface RouteCacheEntry<T> {
  params: Record<string, string>;
  handler: MiddlewareFn<T>;
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
  #middlewares: MiddlewareFn<State>[] = [];
  #addedMiddlewares = false;

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
    this.#middlewares.push(middleware);
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

    let middlewares: MiddlewareFn<State>[] = [];
    let start = 0;
    if (
      routes.length > 0 && routes[0].path === "*" && routes[0].method === "ALL"
    ) {
      start++;
      middlewares = routes[0].handlers;
    }

    // Special case when user calls one of these:
    // - `app.mounApp("/", otherApp)`
    // - `app.mounApp("*", otherApp)`
    const isSelf = path === "*" || path === "/";
    if (isSelf) {
      const selfRoutes = this.#router._routes;
      if (
        selfRoutes.length > 0 && selfRoutes[0].method === "ALL" &&
        selfRoutes[0].path === "*"
      ) {
        selfRoutes[0].handlers.push(...middlewares);
      } else {
        this.#addRoutes("ALL", "*", middlewares);
      }
    }

    for (let i = start; i < routes.length; i++) {
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
    if (!this.#addedMiddlewares) {
      this.#addedMiddlewares = true;
      if (this.#middlewares.length > 0) {
        this.#router.add("ALL", "*", this.#middlewares);
      }
    }
    const merged = typeof pathname === "string"
      ? mergePaths(this.config.basePath, pathname)
      : pathname;
    this.#router.add(method, merged, middlewares);
    return this;
  }

  async handler(): Promise<(request: Request, info?: Deno.ServeHandlerInfo) => Promise<Response>> {
    const next = () =>
      Promise.resolve(new Response("Not found", { status: 404 }));

    // Add default 404 if not present
    if (this.#middlewares.length > 0) {
      this.#addRoutes("ALL", "*", this.#middlewares.concat(next));
    }

    if (this.#buildCache === null) {
      this.#buildCache = await ProdBuildCache.fromSnapshot(this.config);
    }

    if (!this.#buildCache.hasSnapshot) {
      return missingBuildHandler;
    }

    return async (req: Request) => {
      const url = new URL(req.url);
      // Prevent open redirect attacks
      url.pathname = url.pathname.replace(/\/+/g, "/");

      const method = req.method.toUpperCase() as Method;
      const matched = this.#router.match(method, url);

      if (matched.patternMatch && !matched.methodMatch) {
        return new Response("Method not allowed", { status: 405 });
      } else if (!matched.patternMatch && !matched.methodMatch) {
        return next();
      } else if (matched.handlers.length === 0) {
        throw new Error(
          `No route handlers found. This might be a bug in Fresh.`,
        );
      }

      const ctx = new FreshReqContext<State>(
        req,
        this.config,
        next,
        this.#islandRegistry,
        this.#buildCache!,
      );

      const { params, handlers } = matched;
      ctx.params = params;

      if (handlers.length === 1 && handlers[0].length === 1) {
        return handlers[0][0](ctx);
      }

      ctx.next = next;
      try {
        return await runMiddlewares(handlers, ctx);
      } catch (err) {
        console.error(err);
        return new Response("Internal server error", { status: 500 });
      }
    };
  }

  async listen(options: ListenOptions = {}): Promise<void> {
    if (!options.onListen) {
      options.onListen = (params) => {
        const pathname = (this.config.basePath) + "/";
        const protocol = options.key && options.cert ? "https:" : "http:";
        const address = colors.cyan(
          `${protocol}//${params.hostname}:${params.port}${pathname}`,
        );
        const localLabel = colors.bold("Local:");

        // Print more concise output for deploy logs
        if (DENO_DEPLOYMENT_ID) {
          console.log(
            colors.bgRgb8(colors.rgb8(" 🍋 Fresh ready ", 0), 121),
            `${localLabel} ${address}`,
          );
        } else {
          console.log();
          console.log(
            colors.bgRgb8(colors.rgb8(" 🍋 Fresh ready   ", 0), 121),
          );
          const sep = options.remoteAddress ? "" : "\n";
          const space = options.remoteAddress ? " " : "";
          console.log(`    ${localLabel}  ${space}${address}${sep}`);
          if (options.remoteAddress) {
            const remoteLabel = colors.bold("Remote:");
            const remoteAddress = colors.cyan(options.remoteAddress);
            console.log(`    ${remoteLabel}  ${remoteAddress}\n`);
          }
        }
      };
    }

    await Deno.serve(options, await this.handler());
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
