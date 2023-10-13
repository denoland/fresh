import { ComposeCtx, ComposeHandler, createComposeCtx } from "./compose.ts";
import { KnownMethod } from "$fresh/src/server/router.ts";

export interface RouteLayer<S> {
  path: string;
  method: KnownMethod | "*";
  handler: ComposeHandler<S>;
}
function newLayer<S>(
  path: string,
  method: KnownMethod | "*",
  handler: ComposeHandler<S>,
): RouteLayer<S> {
  return { path, method, handler };
}

export interface RouteMethodBranch<S> {
  stack: ComposeHandler<S>[];
  GET: RouteLayer<S>[];
  POST: RouteLayer<S>[];
  PATCH: RouteLayer<S>[];
  PUT: RouteLayer<S>[];
  DELETE: RouteLayer<S>[];
  HEAD: RouteLayer<S>[];
  OPTIONS: RouteLayer<S>[];
  all: RouteLayer<S>[];
}

export class MethodRouter<S = any> {
  #routeItems: RouteLayer<S>[] = [];
  #methods: Record<string, boolean> = {
    GET: false,
    POST: false,
    PATCH: false,
    PUT: false,
    DELETE: false,
    HEAD: false,
  };

  use(handler: ComposeHandler<S>) {
    this.#routeItems.push(newLayer("*", "*", handler));
    return this;
  }

  get(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.push(newLayer(path, "GET", handler));
    return this;
  }

  post(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.push(newLayer(path, "POST", handler));
    return this;
  }

  patch(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.push(newLayer(path, "PATCH", handler));
    return this;
  }

  put(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.push(newLayer(path, "PUT", handler));
    return this;
  }

  delete(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.push(newLayer(path, "DELETE", handler));
    return this;
  }

  head(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.push(newLayer(path, "HEAD", handler));
    return this;
  }

  options(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.push(newLayer(path, "OPTIONS", handler));
    return this;
  }

  all(path: string, handler: ComposeHandler<S>) {
    this.#routeItems.push(newLayer(path, "*", handler));
    return this;
  }

  async dispatch<S>(req: Request, ctx: ComposeCtx<S>): Promise<Response> {
    let method = req.method;
    if (method === "HEAD" && !this.#methods.HEAD) {
      method = "GET";
    }

    for (let i = 0; i < this.#routeItems.length; i++) {
      const layer = this.#routeItems[i];
      if (method !== layer.method && layer.method !== "*") {
        continue;
      }

      const r = await layer.handler(req, ctx);

      console.log(method, req.url, layer);
    }

    return ctx.next();
  }

  denoServerHandler(): Deno.ServeHandler {
    return (req, connInfo) => {
      const ctx = createComposeCtx(req, connInfo);
      return this.dispatch(req, ctx);
    };
  }
}
