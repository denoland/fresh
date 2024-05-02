import type { FreshContext } from "../context.ts";
import { createHelpers, type Helpers } from "../helpers.ts";

/**
 * @deprecated Use {@link FreshContext} instead
 */
export type PageProps<Data = unknown, T = unknown> = FreshContext<Data, T>;

/**
 * @deprecated Use {@link FreshContext} instead
 */
// deno-lint-ignore no-explicit-any
export type RouteContext<T = any, S = Record<string, unknown>> = FreshContext<
  T,
  S
>;

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
