import type { FreshContext } from "../context.ts";
import { createHelpers } from "../helpers.ts";

/**
 * @deprecated Use {@link FreshContext} instead
 */
export type PageProps<Data = unknown, T = unknown> = FreshContext<Data, T>;

const helpers = createHelpers();

/**
 * @deprecated Use {@link definePage} instead
 */
export const defineApp = helpers.definePage;
/**
 * @deprecated Use {@link definePage} instead
 */
export const defineRoute = helpers.definePage;
/**
 * @deprecated Use {@link definePage} instead
 */
export const defineLayout = helpers.definePage;
