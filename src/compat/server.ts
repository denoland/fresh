import type { FreshContext } from "../context.ts";

/**
 * @deprecated Use {@link FreshContext} instead
 */
export type PageProps<Data = unknown, T = unknown> = FreshContext<Data, T>;
