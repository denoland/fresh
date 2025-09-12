import type { DevServer, Middleware } from "./plugin.ts";
import { compose, NOT_FOUND } from "./serve.ts";
import type { State } from "./state.ts";

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
            return new Response(String(mod.content));
          case "bytes":
            return new Response(mod.content as any);
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
