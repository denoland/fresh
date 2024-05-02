import type { FreshContext } from "../context.ts";
import { HandlerByMethod } from "../handlers.ts";
import { createHelpers, type Helpers } from "../helpers.ts";

/**
 * @deprecated Use {@link FreshContext} instead
 */
export type PageProps<Data = unknown, T = unknown> = FreshContext<Data, T>;
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

const helpers = createHelpers();

/**
 * @deprecated Use {@link definePage} instead
 */
export const defineApp: Helpers<unknown>["definePage"] = helpers.definePage;
/**
 * @deprecated Use {@link definePage} instead
 */
export const defineRoute: Helpers<unknown>["definePage"] = helpers.definePage;
/**
 * @deprecated Use {@link definePage} instead
 */
export const defineLayout: Helpers<unknown>["definePage"] = helpers.definePage;
