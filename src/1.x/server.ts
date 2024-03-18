import { FreshContext } from "../context.ts";

/**
 * @deprecated Use {@link FreshContext} instead
 */
export type PageProps<Data, T = unknown> = FreshContext<T, Data>;
