import { DENO_DEPLOYMENT_ID } from "./constants.ts";
import { colors } from "../server/deps.ts";
import { compose, Middleware } from "./middlewares.ts";
import { createContext } from "./context.ts";

export interface RouteContext<State> {
  req: Request;
  url: URL;
  state: State;
}

export interface Render<T> {
  data: T;
  head?: string[];
  headers?: string[];
  status?: number;
}

export type RouteHandler<Data, State> =
  | RouteHandlerSimple<Data, State>
  | RouteHandlerByMethod<Data, State>;

export interface RouteHandlerSimple<Data, State> {
  (
    ctx: RouteContext<State>,
  ): Response | Render<Data> | Promise<Response | Render<Data>>;
}

export type Method = "HEAD" | "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type RouteHandlerByMethod<Data, State> =
  & {
    [M in Method]?: RouteHandlerSimple<Data, State>;
  }
  & {
    [method: string]: RouteHandlerSimple<Data, State>;
  };

export type RouteData<
  Handler extends RouteHandler<unknown, unknown>,
> = Handler extends (RouteHandler<infer Data, unknown>) ? Data
  : never;

export interface RouteProps<Data, State> {
  data: Data;
  state: State;
}

export interface App<State> {
  defineHandlers<
    Data,
    Handlers extends RouteHandler<Data, State> = RouteHandler<Data, State>,
  >(
    handlers: Handlers,
  ): typeof handlers;
  definePage<
    Handler extends RouteHandler<unknown, State> = never,
    Data = Handler extends RouteHandlerByMethod<infer Data, State> ? Data
      : never,
  >(render: (props: RouteProps<Data, State>) => string): typeof render;

  use(middleware: Middleware<State>): this;
  route(path: string, app: App<State>): this;
  toMiddleware(): Middleware<State>;

  listen(options?: ListenOptions): Promise<void>;
}

export interface ListenOptions extends Partial<Deno.ServeTlsOptions> {
  basePath?: string;
  remoteAddress?: string;
}

export class FreshApp<State> implements App<State> {
  #middlewares: Middleware<State>[][] = [[]];

  defineHandlers(_handlers) {
    return null as any;
  }

  definePage(_render) {
    //
    return null as any;
  }

  use(middleware: Middleware<State>): this {
    this.#middlewares[this.#middlewares.length - 1].push(middleware);
    return this;
  }

  route(path: string, middleware: App<State> | Middleware<State>): this {
    const mid = typeof middleware === "function"
      ? middleware
      : middleware.toMiddleware();
    this.#middlewares[this.#middlewares.length - 1].push(mid);
    return this;
  }

  toMiddleware(): Middleware<State> {
    return compose<State>(this.#middlewares.flat());
  }

  handler(): (request: Request) => Promise<Response> {
    const middleware = this.toMiddleware();
    const next = async () => new Response("Not found", { status: 404 });

    return async (req: Request) => {
      const url = new URL(req.url);
      // Prevent open redirect attacks
      url.pathname = url.pathname.replace(/\/+/g, "/");

      const ctx = createContext<State>(req, next);

      return await middleware(ctx);
    };
  }

  async listen(options: ListenOptions = {}): Promise<void> {
    if (!options.onListen) {
      options.onListen = (params) => {
        const pathname = (options.basePath ?? "") + "/";
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

export function createApp<
  // deno-lint-ignore no-explicit-any
  State extends Record<string, any> = never,
>(): App<State> {
  return new FreshApp<State>();
}
