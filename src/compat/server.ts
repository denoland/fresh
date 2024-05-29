import type { VNode } from "preact";
import type { FreshContext } from "../context.ts";
import type { HandlerFn, RouteHandler } from "../handlers.ts";
import type { PageProps } from "../runtime/server/mod.tsx";

/**
 * @deprecated Use {@link PageProps} instead.
 */
export type AppProps<_Data = unknown, T = unknown> = FreshContext<T>;
/**
 * @deprecated Use {@link PageProps} instead.
 */
export type LayoutProps<_Data = unknown, T = unknown> = FreshContext<T>;
/**
 * @deprecated Use {@link PageProps} instead.
 */
export type UnknownPageProps<_Data = unknown, T = unknown> = FreshContext<T>;
/**
 * @deprecated Use {@link PageProps} instead.
 */
export type ErrorPageProps<_Data = unknown, T = unknown> = FreshContext<T>;

/**
 * @deprecated Use {@link FreshContext} instead.
 */
export type RouteContext<_T = never, S = Record<string, unknown>> =
  FreshContext<S>;

/**
 * @deprecated Use {@link RouteHandler} instead.
 */
// deno-lint-ignore no-explicit-any
export type Handlers<T = any, State = Record<string, unknown>> = RouteHandler<
  T,
  State
>;

/**
 * @deprecated Use {@link HandlerFn} instead.
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
 * @deprecated Use {@link [../mod.ts].Define.page|define.page} instead.
 */
export const defineApp = defineFn;
/**
 * @deprecated Use {@link [../mod.ts].Define.page|define.page} instead.
 */
export const defineRoute = defineFn;
/**
 * @deprecated Use {@link [../mod.ts].Define.page|define.page} instead.
 */
export const defineLayout = defineFn;
