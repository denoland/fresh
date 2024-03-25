import { DENO_DEPLOYMENT_ID } from "./constants.ts";
import * as colors from "@std/fmt/colors";
import { compose, Middleware } from "./middlewares/compose.ts";
import { FreshReqContext } from "./context.ts";
import { mergePaths, Method, Router, UrlPatternRouter } from "./router.ts";
import { FreshConfig, normalizeConfig, ResolvedFreshConfig } from "./config.ts";
import {
  BuildCache,
  BuildCacheSnapshot,
  FreshBuildCache,
} from "./build_cache.ts";
import * as path from "@std/path";
import { ComponentType } from "preact";

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
  readonly router: Router<Middleware<State>>;
  readonly config: ResolvedFreshConfig;

  island(filePathOrUrl: string | URL, name: string, fn: ComponentType): void;

  use(middleware: Middleware<State>): this;
  get(path: string, middleware: Middleware<State>): this;
  post(path: string, middleware: Middleware<State>): this;
  patch(path: string, middleware: Middleware<State>): this;
  put(path: string, middleware: Middleware<State>): this;
  delete(path: string, middleware: Middleware<State>): this;
  head(path: string, middleware: Middleware<State>): this;
  all(path: string, middleware: Middleware<State>): this;

  handler(): (
    request: Request,
    info: Deno.ServeHandlerInfo,
  ) => Promise<Response>;
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
  router: Router<Middleware<State>> = new UrlPatternRouter<Middleware<State>>();
  buildCache: BuildCache | null = null;
  #routeCache = new Map<string, RouteCacheEntry<State>>();
  #islandNames = new Set<string>();

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
    fn: ComponentType,
  ): void {
    const filePath = filePathOrUrl instanceof URL
      ? filePathOrUrl.href
      : filePathOrUrl;

    // Create unique island name
    let name = path.basename(filePath, path.extname(filePath));
    if (this.#islandNames.has(name)) {
      let i = 0;
      while (this.#islandNames.has(`${name}_${i}`)) {
        i++;
      }
      name = `${name}_${i}`;
    }

    GLOBAL_ISLANDS.set(fn, { fn, exportName, name, file: filePathOrUrl });
  }

  use(middleware: Middleware<State>): this {
    this.router.add({ method: "ALL", path: "*", handler: middleware });
    return this;
  }

  get(path: string, handler: Middleware<State>): this {
    const merged = mergePaths(this.config.basePath, path);
    this.router.add({ method: "GET", path: merged, handler });
    return this;
  }
  post(path: string, handler: Middleware<State>): this {
    const merged = mergePaths(this.config.basePath, path);
    this.router.add({ method: "POST", path: merged, handler });
    return this;
  }
  patch(path: string, handler: Middleware<State>): this {
    const merged = mergePaths(this.config.basePath, path);
    this.router.add({ method: "PATCH", path: merged, handler });
    return this;
  }
  put(path: string, handler: Middleware<State>): this {
    const merged = mergePaths(this.config.basePath, path);
    this.router.add({ method: "PUT", path: merged, handler });
    return this;
  }
  delete(path: string, handler: Middleware<State>): this {
    const merged = mergePaths(this.config.basePath, path);
    this.router.add({ method: "DELETE", path: merged, handler });
    return this;
  }
  head(path: string, handler: Middleware<State>): this {
    const merged = mergePaths(this.config.basePath, path);
    this.router.add({ method: "HEAD", path: merged, handler });
    return this;
  }
  all(path: string, handler: Middleware<State>): this {
    const merged = mergePaths(this.config.basePath, path);
    this.router.add({ method: "ALL", path: merged, handler });
    return this;
  }

  // TODO: Rename to mount()?
  route(path: string, app: App<State>): this {
    const routes = app.router._routes;
    const base = mergePaths(this.config.basePath, path);

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];

      this.router.add(route);

      // FIXME: Properly merge routers
      // const mergedPath = route.path instanceof URLPattern
      //   ? route.path
      //   : mergePaths(base, route.path);
      // console.log({ mergedPath, m: route.method });
      // this.router.add({
      //   handler: route.handler,
      //   method: route.method,
      //   path: mergedPath,
      // });
    }

    return this;
  }

  handler(): (request: Request) => Promise<Response> {
    const next = () =>
      Promise.resolve(new Response("Not found", { status: 404 }));

    return async (req: Request) => {
      const url = new URL(req.url);
      // Prevent open redirect attacks
      url.pathname = url.pathname.replace(/\/+/g, "/");

      const ctx = new FreshReqContext<State>(req, this.config, next);
      ctx.buildCache = this.buildCache;

      const cacheKey = `${req.method} ${req.url}`;
      const cached = this.#routeCache.get(cacheKey);
      if (cached !== undefined) {
        ctx.params = cached.params;
        return cached.handler(ctx);
      }

      const method = req.method.toUpperCase() as Method;
      const matched = this.router.match(method, url);

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

      const handler = handlers.length === 1 ? handlers[0] : compose(handlers);

      this.#routeCache.set(cacheKey, {
        params,
        handler,
      });

      return await handler(ctx);
    };
  }

  async listen(options: ListenOptions = {}): Promise<void> {
    if (this.buildCache === null) {
      const snapshotPath = path.join(this.config.build.outDir, "snapshot.json");

      let snapshot: BuildCacheSnapshot | null = null;
      try {
        const content = await Deno.readTextFile(snapshotPath);
        snapshot = JSON.parse(content) as BuildCacheSnapshot;
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
      }
      this.buildCache = new FreshBuildCache(snapshot);
    }

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

    await Deno.serve(options, this.handler());
  }
}
