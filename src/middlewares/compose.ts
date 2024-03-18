import { FreshContext } from "../context.ts";

export type Middleware<State = unknown> = (
  ctx: FreshContext<State>,
) => Response | Promise<Response>;

export function compose<T = unknown>(
  middlewares: Middleware<T>[],
): Middleware<T> {
  // No need to wrap this
  if (middlewares.length === 1) {
    return middlewares[0];
  }

  return (ctx) => {
    const originalNext = ctx.next;

    let idx = -1;
    async function dispatch(i: number): Promise<Response> {
      if (i <= idx) {
        throw new Error("ctx.next() called multiple times");
      }
      idx = i;
      if (i === middlewares.length) {
        return originalNext();
      }

      ctx.next = () => dispatch(i + 1);
      return await middlewares[i](ctx);
    }

    return dispatch(0);
  };
}
