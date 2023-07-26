import { Handler, ServeHandlerInfo } from "$fresh/server.ts";

export interface FreshRouter<State = Record<string, unknown>> {
  get(pattern: string, ...handlers: Handler<unknown, State>[]): this;
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
  return {
    async serve() {
      //
    },
    async handler() {
      //
    },
  };
}
