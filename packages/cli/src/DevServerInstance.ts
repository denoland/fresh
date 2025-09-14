import type { DevServer, Loader, Middleware } from "./plugin.ts";
import {
  finalizeModule,
  loadAndTransform,
  resolveId,
} from "./plugin_container.ts";
import type { ModuleNode, State } from "./state.ts";

const NOT_FOUND = () =>
  Promise.resolve(new Response("Not Found", { status: 404 }));

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

  async loadModule(envName: string, id: string) {
    const env = this.#state.environments.get(envName)!;

    console.log("LOAD", envName, id, env);
    return await env.runner.loadModule(id);
  }

  async fetchModule(
    envName: string,
    id: string,
  ): Promise<ModuleNode> {
    const env = this.#state.environments.get(envName);
    if (env === undefined) {
      throw new Error(`Unknown environment: ${envName}`);
    }

    const resolved = await resolveId(env, id, null);

    if (!resolved) {
      throw new Error(`Could not resolve ${id}`);
    }

    if (resolved.external) {
      throw new Error(`External module: ${id}`);
    }

    const loaded = await loadAndTransform(env, resolved.id);

    const finalized = await finalizeModule(this.#state, env, loaded);

    return finalized;
  }

  fetch(): (req: Request) => Promise<Response> {
    this.#middlewares.push(async (req, next) => {
      const url = new URL(req.url);

      let urlId = url.pathname;
      if (url.search !== "") {
        urlId += `?${url.search}`;
      }

      let mod = this.moduleGraph.byUrl("client", urlId);
      if (mod === undefined) {
        mod = await this.fetchModule("client", "");
      }

      console.log({ mod });
      if (mod !== undefined) {
        if (mod.type === "external") return next();

        const headers = new Headers();
        headers.set("Content-Type", toMime(mod.loader));

        switch (mod.loader) {
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
      const localNext = nextFn;
      nextFn = () => {
        return Promise.resolve(fn(req, localNext));
      };
    }

    return await nextFn();
  };
}

function toMime(moduleType: Loader): string {
  switch (moduleType) {
    case "js":
    case "jsx":
    case "cjs":
    case "mjs":
    case "ts":
    case "tsx":
      return "text/javascript; charset=UTF-8";
    case "css-module":
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
