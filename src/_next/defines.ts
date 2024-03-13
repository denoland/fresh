import { FunctionComponent } from "preact";
import { FreshContext } from "./context.ts";
import { Middleware } from "./middlewares/compose.ts";
import { Method } from "./router.ts";

export interface Render<T> {
  data: T;
  head?: string[];
  headers?: string[];
  status?: number;
}

export type RouteHandler<Data, State> =
  | HandlerFn<Data, State>
  | HandlerMethod<Data, State>;

export interface HandlerFn<Data, State> {
  (
    ctx: FreshContext<State>,
  ): Response | Render<Data> | Promise<Response | Render<Data>>;
}

export type HandlerMethod<Data, State> = {
  [M in Method]?: HandlerFn<Data, State>;
};

export type RouteData<
  Handler extends RouteHandler<unknown, unknown>,
> = Handler extends (RouteHandler<infer Data, unknown>) ? Data
  : never;

export interface RouteProps<Data, State> {
  data: Data;
  state: State;
}

export type DefineHandlers<
  State,
  Data,
  Handlers extends RouteHandler<Data, State> = RouteHandler<Data, State>,
> = (
  handlers: Handlers,
) => typeof handlers;

export interface FreshHelpers<State> {
  defineMiddleware(middleware: Middleware<State>): Middleware<State>;
  defineHandlers<Data, Handlers extends RouteHandler<Data, State>>(
    handlers: Handlers,
  ): typeof handlers;
  definePage<
    Handler extends RouteHandler<unknown, State> = never,
    Data = Handler extends HandlerMethod<infer Data, State> ? Data : never,
  >(render: FunctionComponent<RouteProps<Data, State>>): typeof render;
}
