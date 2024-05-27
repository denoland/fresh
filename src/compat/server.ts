import type { VNode } from "preact";
import type { FreshContext } from "../context.ts";
import type { HandlerByMethod } from "../handlers.ts";

/**
 * @deprecated Use {@link FreshContext} instead
 */
export type AppProps<_Data = unknown, T = unknown> = FreshContext<T>;
/**
 * @deprecated Use {@link FreshContext} instead
 */
export type LayoutProps<_Data = unknown, T = unknown> = FreshContext<T>;
/**
 * @deprecated Use {@link FreshContext} instead
 */
export type UnknownPageProps<_Data = unknown, T = unknown> = FreshContext<T>;
/**
 * @deprecated Use {@link FreshContext} instead
 */
export type ErrorPageProps<_Data = unknown, T = unknown> = FreshContext<T>;

/**
 * @deprecated Use {@link FreshContext} instead
 */
export type RouteContext<_T = never, S = Record<string, unknown>> =
  FreshContext<S>;

// deno-lint-ignore no-explicit-any
export type Handlers<T = any, State = Record<string, unknown>> =
  HandlerByMethod<T, State>;

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
 * @deprecated Use {@link definePage} instead
 */
export const defineApp = defineFn;
/**
 * @deprecated Use {@link definePage} instead
 */
export const defineRoute = defineFn;
/**
 * @deprecated Use {@link definePage} instead
 */
export const defineLayout = defineFn;
