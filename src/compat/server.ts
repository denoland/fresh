import type { VNode } from "preact";
import type { FreshContext } from "../context.ts";
import type { HandlerByMethod } from "../handlers.ts";

/**
 * @deprecated Use {@link FreshContext} instead
 */
export type AppProps<Data = unknown, T = unknown> = FreshContext<Data, T>;
/**
 * @deprecated Use {@link FreshContext} instead
 */
export type LayoutProps<Data = unknown, T = unknown> = FreshContext<Data, T>;
/**
 * @deprecated Use {@link FreshContext} instead
 */
export type UnkownPageProps<Data = unknown, T = unknown> = FreshContext<
  Data,
  T
>;
/**
 * @deprecated Use {@link FreshContext} instead
 */
export type ErrorPageProps<Data = unknown, T = unknown> = FreshContext<Data, T>;

/**
 * @deprecated Use {@link FreshContext} instead
 */
// deno-lint-ignore no-explicit-any
export type RouteContext<T = any, S = Record<string, unknown>> = FreshContext<
  T,
  S
>;

// deno-lint-ignore no-explicit-any
export type Handlers<T = any, State = Record<string, unknown>> =
  HandlerByMethod<T, State>;

function defineFn<State>(
  fn: (
    ctx: FreshContext<unknown, State>,
  ) => Request | VNode | null | Promise<Request | VNode | null>,
): (
  ctx: FreshContext<unknown, State>,
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
