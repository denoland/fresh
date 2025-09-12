import { boot } from "./boot.ts";
import type { ResolvedConfig } from "./config.ts";
import type { DevServer, Middleware, ModuleType } from "./plugin.ts";
import type { State } from "./state.ts";

const NOT_FOUND = () =>
  Promise.resolve(new Response("Not Found", { status: 404 }));

export async function serve(config: ResolvedConfig) {
  const state = await boot(config);

  const server = new DevServerInstance(state);

  const { plugins } = state.config;
  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    if (plugin.configureServer !== undefined) {
      await plugin.configureServer(server);
    }
  }

  return server.fetch();
}

export class DevServerInstance implements DevServer {
  address = "";
  #middlewares: Middleware[] = [];
  #state: State;

  get moduleGraph() {
    return this.#state.moduleGraph;
  }

  constructor(state: State) {
    this.#state = state;
  }

  use(middleware: Middleware): this {
    this.#middlewares.push(middleware);
    return this;
  }

  fetch(): (req: Request) => Promise<Response> {
    this.#middlewares.push(async (req, next) => {
      const url = new URL(req.url);

      let urlId = url.pathname;
      if (url.search !== "") {
        urlId += `?${url.search}`;
      }

      const mod = this.moduleGraph.byUrl("client", urlId);
      if (mod !== undefined) {
        const headers = new Headers();
        headers.set("Content-Type", toMime(mod.moduleType));

        switch (mod.moduleType) {
          case "json":
            return Response.json(mod.content);
          case "js":
          case "jsx":
          case "cjs":
          case "mjs":
          case "ts":
          case "tsx":
          case "text":
          case "yaml":
          case "toml":
          case "sass":
          case "less":
          case "css":
          case "md":
          case "svg":
            return new Response(String(mod.content), { headers });
          case "bytes":
          default:
            // deno-lint-ignore no-explicit-any
            return new Response(mod.content as any, { headers });
        }
      }

      return await next();
    });

    const composed = compose(this.#middlewares);

    return async (req) => {
      return await composed(req, NOT_FOUND);
    };
  }
}

function compose(middlewares: Middleware[]): Middleware {
  return async (req, next) => {
    let nextFn = next;

    for (let i = middlewares.length - 1; i >= 0; i--) {
      const fn = middlewares[i];
      nextFn = () => Promise.resolve(fn(req, nextFn));
    }

    return await nextFn();
  };
}

function toMime(moduleType: ModuleType): string {
  switch (moduleType) {
    case "js":
    case "jsx":
    case "cjs":
    case "mjs":
    case "ts":
    case "tsx":
      return "text/javascript; charset=UTF-8";
    case "css":
      return "text/css; charset=UTF-8";
    case "html":
      return "text/html; charset=UTF-8";
    case "json":
      return "application/json; charset=UTF-8";
    case "md":
      return "text/markdown; charset=UTF-8";
    case "svg":
      return "image/svg+xml; charset=UTF-8";
    case "text":
    case "sass":
    case "less":
    case "yaml":
    case "toml":
    case "bytes":
      return "text/plain; charset=UTF-8";
  }
}
