import { DENO_DEPLOYMENT_ID } from "./constants.ts";
import { colors } from "../server/deps.ts";
import { Middleware } from "./middlewares/compose.ts";
import { createContext } from "./context.ts";
import { mergePaths, Method, UrlPatternRouter } from "./router.ts";
import { FreshConfig, normalizeConfig, ResolvedFreshConfig } from "./config.ts";
import { compose } from "$fresh/src/_next/middlewares/compose.ts";

export interface App<State> {
  readonly config: ResolvedFreshConfig;
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
  router = new UrlPatternRouter<Middleware<State>>();
  #routeCache = new Map<string, RouteCacheEntry<State>>();

  config: ResolvedFreshConfig;

  constructor(config: FreshConfig = {}) {
    this.config = normalizeConfig(config);
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

  handler(): (request: Request) => Promise<Response> {
    const next = () =>
      Promise.resolve(new Response("Not found", { status: 404 }));

    return async (req: Request) => {
      const url = new URL(req.url);
      // Prevent open redirect attacks
      url.pathname = url.pathname.replace(/\/+/g, "/");

      const ctx = createContext<State>(req, this.config, next);

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
