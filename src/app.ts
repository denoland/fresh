import { DENO_DEPLOYMENT_ID } from "./constants.ts";
import * as colors from "@std/fmt/colors";
import { type Middleware, runMiddlewares } from "./middlewares/mod.ts";
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
import type { ComponentType } from "preact";

export interface Island {
  file: string | URL;
  name: string;
  exportName: string;
  fn: ComponentType;
}

export const GLOBAL_ISLANDS: Map<ComponentType, Island> = new Map<
  ComponentType,
  Island
>();

export interface App<State> {
  readonly _router: Router<Middleware<State>>;
  readonly config: Readonly<ResolvedFreshConfig>;

  island(filePathOrUrl: string | URL, name: string, fn: ComponentType): void;

  use(middleware: Middleware<State>): this;
  get(path: string, ...middlewares: Middleware<State>[]): this;
  post(path: string, ...middlewares: Middleware<State>[]): this;
  patch(path: string, ...middlewares: Middleware<State>[]): this;
  put(path: string, ...middlewares: Middleware<State>[]): this;
  delete(path: string, ...middlewares: Middleware<State>[]): this;
  head(path: string, ...middlewares: Middleware<State>[]): this;
  all(path: string, ...middlewares: Middleware<State>[]): this;

  handler(): Promise<
    (request: Request, info: Deno.ServeHandlerInfo) => Promise<Response>
  >;
  listen(options?: ListenOptions): Promise<void>;
}

export interface ListenOptions extends Partial<Deno.ServeTlsOptions> {
  remoteAddress?: string;
}

export interface RouteCacheEntry<T> {
  params: Record<string, string>;
  handler: Middleware<T>;
}

export class FreshApp<State> implements App<State> {
  _router: Router<Middleware<State>> = new UrlPatternRouter<
    Middleware<State>
  >();
  #islandNames = new Set<string>();
  #middlewares: Middleware<State>[] = [];
  #addedMiddlewares = false;

  /**
   * The final resolved Fresh configuration.
   */
  config: ResolvedFreshConfig;

  protected buildCache: BuildCache | null = null;

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

    GLOBAL_ISLANDS.set(fn, { fn, exportName, name, file: filePathOrUrl });
    return this;
  }

  use(middleware: Middleware<State>): this {
    this.#middlewares.push(middleware);
    return this;
  }

  get(path: string, ...middlewares: Middleware<State>[]): this {
    return this.#addRoutes("GET", path, middlewares);
  }
  post(path: string, ...middlewares: Middleware<State>[]): this {
    return this.#addRoutes("POST", path, middlewares);
  }
  patch(path: string, ...middlewares: Middleware<State>[]): this {
    return this.#addRoutes("PATCH", path, middlewares);
  }
  put(path: string, ...middlewares: Middleware<State>[]): this {
    return this.#addRoutes("PUT", path, middlewares);
  }
  delete(path: string, ...middlewares: Middleware<State>[]): this {
    return this.#addRoutes("DELETE", path, middlewares);
  }
  head(path: string, ...middlewares: Middleware<State>[]): this {
    return this.#addRoutes("HEAD", path, middlewares);
  }
  all(path: string, ...middlewares: Middleware<State>[]): this {
    return this.#addRoutes("ALL", path, middlewares);
  }

  mountApp(path: string, app: App<State>): this {
    const routes = app._router._routes;

    let middlewares: Middleware<State>[] = [];
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
      const selfRoutes = this._router._routes;
      if (
        selfRoutes.length > 0 && selfRoutes[0].method === "ALL" &&
        selfRoutes[0].path === "*"
      ) {
        selfRoutes[0].handlers.push(...middlewares);
      } else {
        this._router._routes.unshift({
          handlers: middlewares,
          method: "ALL",
          path: "*",
        });
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
      this._router.add(route.method, merged, combined);
    }

    return this;
  }

  #addRoutes(
    method: Method | "ALL",
    pathname: string | URLPattern,
    middlewares: Middleware<State>[],
  ): this {
    if (!this.#addedMiddlewares) {
      this.#addedMiddlewares = true;
      if (this.#middlewares.length > 0) {
        this._router.add("ALL", "*", this.#middlewares);
      }
    }
    const merged = typeof pathname === "string"
      ? mergePaths(this.config.basePath, pathname)
      : pathname;
    this._router.add(method, merged, middlewares);
    return this;
  }

  async handler(): Promise<(request: Request) => Promise<Response>> {
    const next = () =>
      Promise.resolve(new Response("Not found", { status: 404 }));

    // Add default 404 if not present
    if (this.#middlewares.length > 0) {
      this.#addRoutes("ALL", "*", this.#middlewares.concat(next));
    }

    if (this.buildCache === null) {
      this.buildCache = await ProdBuildCache.fromSnapshot(this.config);
    }

    // deno-lint-ignore require-await
    return async (req: Request) => {
      const url = new URL(req.url);
      // Prevent open redirect attacks
      url.pathname = url.pathname.replace(/\/+/g, "/");

      const ctx = new FreshReqContext<State>(
        req,
        this.config,
        next,
        this.buildCache!,
      );

      const method = req.method.toUpperCase() as Method;
      const matched = this._router.match(method, url);

      if (matched.patternMatch && !matched.methodMatch) {
        return new Response("Method not allowed", { status: 405 });
      } else if (!matched.patternMatch && !matched.methodMatch) {
        return next();
      } else if (matched.handlers.length === 0) {
        throw new Error(
          `No route handlers found. This might be a bug in Fresh.`,
        );
      }

      const { params, handlers } = matched;
      ctx.params = params;

      if (handlers.length === 1 && handlers[0].length === 1) {
        return handlers[0][0](ctx);
      }

      ctx.next = next;
      return runMiddlewares(handlers, ctx);
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
