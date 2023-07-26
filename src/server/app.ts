import { Handler, ServeHandlerInfo } from "$fresh/server.ts";

export interface RouteDefinition<State = Record<string, unknown>> {
  route: string;
  get?: Handler<unknown, unknown>;
  head?: Handler<unknown, unknown>;
  post?: Handler<unknown, unknown>;
  put?: Handler<unknown, unknown>;
  delete?: Handler<unknown, unknown>;
  options?: Handler<unknown, unknown>;
  patch?: Handler<unknown, unknown>;

  component?: () => {};
  layout?: () => {};
}

export class FreshRouter<State = Record<string, unknown>> {
  _routes = new Map<string, RouteDefinition>();
  get(pattern: string, handler: Handler<unknown, State>): this {
    if (!this._routes.has(pattern)) {
      this._routes.set(pattern, {
        route: pattern,
        get: handler,
      });
    }
    return this;
  }
  post(pattern: string, ...handlers: Handler<unknown, State>[]): this;
  patch(pattern: string, ...handlers: Handler<unknown, State>[]): this;
  put(pattern: string, ...handlers: Handler<unknown, State>[]): this;
  delete(pattern: string, ...handlers: Handler<unknown, State>[]): this;

  use(pattern: string, ...handlers: Handler<unknown, State>[]): this;
}

export function createRouter<State>(): FreshRouter<State> {
}

export interface FreshApp<State = Record<string, unknown>>
  extends FreshRouter<State> {
  handler(): Promise<
    (req: Request, connInfo?: ServeHandlerInfo) => Promise<Response>
  >;
  serve(): Promise<void>;
}

export function createApp<State = Record<string, unknown>>(): FreshApp<State> {
  const router = createRouter();

  return {
    async serve() {
      //
    },
    async handler() {
      //
    },
  };
}
