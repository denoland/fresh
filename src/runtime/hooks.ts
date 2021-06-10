import { createContext, useContext } from "./deps.ts";
import { IS_BROWSER } from "./utils.ts";

export const DATA_CONTEXT = createContext(new Map<string, unknown>());

export type Fetcher<T> = (key: string) => T | Promise<T>;

/**
 * The `useData` hook can be used to fetch some data during JIT rendering.
 * On the client the hook will return the data that was computed during JIT
 * rendering. If `useData` is called on the client with a different key than
 * during JIT rendering, an error will occur.
 *
 * The fetcher can be asynchronous. The render will be suspended while waiting
 * for the asynchronous data to be ready. Once the promise is ready we rerender.
 * Because of the suspense it is possible that a page or component can be
 * rendered more than once during a JIT render.
 *
 * ```tsx
 * export default function App() {
 *   const { latest, versions } = useData("https://cdn.deno.land/std/meta/versions.json", fetcher);
 *   return <p>The Deno standard library has {versions.length} versions, with {latest} being the most recent.</p>
 * }
 *
 * async function fetcher(url: string) {
 *   const resp = await fetch(url);
 *   return resp.json();
 * }
 * ```
 *
 * @param key A unique identifier for this data.
 * @param fetcher The function used to fetch data based on the above key.
 * @returns The the data that the promise returned from `fetcher` resolves to.
 */
export function useData<T>(key: string, fetcher: Fetcher<T>): T {
  const DATA_CACHE = useContext(DATA_CONTEXT);

  // If there is no data or pending promise for this key in the data cache yet,
  // call the fetcher, store it into the cache, and possibly suspend.
  if (!DATA_CACHE.has(key)) {
    if (IS_BROWSER) {
      throw new Error(
        `'useData' can not fetch new data on the client. The JIT render did not generate data for key '${key}'.`,
      );
    }
    const data = fetcher(key);
    if (data instanceof Promise) {
      data.then((data) => {
        DATA_CACHE.set(key, data);
      });
    }
    DATA_CACHE.set(key, data);
  }

  const data = DATA_CACHE.get(key);
  // If the data is a promise, suspend the component.
  if (data instanceof Promise) throw data;
  // else return the data.
  return data as T;
}
