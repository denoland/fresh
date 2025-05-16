import type { VNode } from "preact";
import type { FreshContext } from "./context.ts";
import type { HandlerFn, RouteHandler } from "./handlers.ts";

/**
 * @deprecated Use {@linkcode PageProps} instead.
 */
export type AppProps<_Data = unknown, T = unknown> = FreshContext<T>;
/**
 * @deprecated Use {@linkcode PageProps} instead.
 */
export type LayoutProps<_Data = unknown, T = unknown> = FreshContext<T>;
/**
 * @deprecated Use {@linkcode PageProps} instead.
 */
export type UnknownPageProps<_Data = unknown, T = unknown> = FreshContext<T>;
/**
 * @deprecated Use {@linkcode PageProps} instead.
 */
export type ErrorPageProps<_Data = unknown, T = unknown> = FreshContext<T>;

/**
 * @deprecated Use {@linkcode FreshContext} instead.
 */
export type RouteContext<_T = never, S = Record<string, unknown>> =
  FreshContext<S>;

/**
 * @deprecated Use {@linkcode RouteHandler} instead.
 */
// deno-lint-ignore no-explicit-any
export type Handlers<T = any, State = Record<string, unknown>> = RouteHandler<
  T,
  State
>;

/**
 * @deprecated Use {@linkcode HandlerFn} instead.
 */
// deno-lint-ignore no-explicit-any
export type Handler<T = any, State = Record<string, unknown>> = HandlerFn<
  T,
  State
>;

function defineFn<State>(
  fn: (
    ctx: FreshContext<State>,
  ) => Request | VNode | null | Promise<Request | VNode | null>,
): (
  ctx: FreshContext<State>,
) => Request | VNode | null | Promise<Request | VNode | null> {
  return fn;
}

/**
 * @deprecated Use {@linkcode [./mod.ts].Define.page|define.page} instead.
 */
export const defineApp = defineFn;
/**
 * @deprecated Use {@linkcode [./mod.ts].Define.page|define.page} instead.
 */
export const defineRoute = defineFn;
/**
 * @deprecated Use {@linkcode [./mod.ts].Define.page|define.page} instead.
 */
export const defineLayout = defineFn;
