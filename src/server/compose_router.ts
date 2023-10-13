import { ComposeCtx, ComposeHandler, createComposeCtx } from "./compose.ts";
import { KnownMethod } from "$fresh/src/server/router.ts";

export interface RouteItem<S> {
  path: string;
  handler: ComposeHandler<S>;
}

export interface RouteMethodBranch<S> {
  use: ComposeHandler<S>[];
  GET: RouteItem<S>[];
  POST: RouteItem<S>[];
  PATCH: RouteItem<S>[];
  PUT: RouteItem<S>[];
  DELETE: RouteItem<S>[];
  HEAD: RouteItem<S>[];
  OPTIONS: RouteItem<S>[];
  all: RouteItem<S>[];
}

export class MethodRouter<S = any> {
  #routeItems: RouteMethodBranch<S> = {
    use: [],
    GET: [],
    POST: [],
    PATCH: [],
    PUT: [],
    DELETE: [],
    HEAD: [],
    OPTIONS: [],
    all: [],
  };

  use(handler: ComposeHandler<S>) {
    this.#routeItems.use.push(handler);
    return this;
  }

  get(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.GET.push({ path, handler });
    return this;
  }

  post(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.POST.push({ path, handler });
    return this;
  }

  patch(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.PATCH.push({ path, handler });
    return this;
  }

  put(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.PUT.push({ path, handler });
    return this;
  }

  delete(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.DELETE.push({ path, handler });
    return this;
  }

  head(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.HEAD.push({ path, handler });
    return this;
  }

  options(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.OPTIONS.push({ path, handler });
    return this;
  }

  all(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.all.push({ path, handler });
    return this;
  }

  handler(): ComposeHandler<S> {
    // TODO: Sort routes

    return (req, ctx) => {
      const method = req.method as KnownMethod;
      if (!(method in this.#routeItems)) {
        throw new Error(`Unknown HTTP method: ${method}`);
      }

      return new Response(null);
    };
  }

  denoServerHandler(): Deno.ServeHandler {
    const handler = this.handler();
    return (req, connInfo) => {
      const ctx = createComposeCtx(req, connInfo);
      return handler(req, ctx);
    };
  }
}
