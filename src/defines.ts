import type { FunctionComponent } from "preact";
import type { FreshContext } from "./context.ts";
import type { Method } from "./router.ts";

export interface Render<T> {
  data: T;
  head?: string[];
  headers?: string[];
  status?: number;
}

export type RouteHandler<Data, State> =
  | HandlerFn<Data, State>
  | HandlerMethod<Data, State>;

export function isHandlerMethod<D, S>(
  handler: RouteHandler<D, S> | undefined,
): handler is HandlerMethod<D, S> {
  return handler !== null && typeof handler === "object";
}

export interface HandlerFn<Data, State> {
  (
    ctx: FreshContext<State>,
  ):
    | Response
    | Render<Data>
    | void
    | Promise<Response | Render<Data> | void>;
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

export function defineHandlers<
  State,
  Data,
  Handlers extends RouteHandler<Data, State>,
>(
  handlers: Handlers,
): typeof handlers {
  return handlers;
}

export function definePage<
  State,
  Handler extends RouteHandler<unknown, State> = never,
  Data = Handler extends HandlerMethod<infer Data, State> ? Data : never,
>(render: FunctionComponent<RouteProps<Data, State>>): typeof render {
  return render;
}
