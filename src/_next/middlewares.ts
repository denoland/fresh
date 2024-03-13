import { FreshContext } from "./context.ts";

export type Middleware<State = unknown> = (
  ctx: FreshContext<State>,
) => Response | Promise<Response>;

export function compose<T = unknown>(
  middlewares: Middleware<T>[],
): Middleware<T> {
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

export const trailingSlashes = (mode: "always" | "never"): Middleware => {
  return function trailingSlashesMiddleware(ctx) {
    const url = ctx.url;
    if (url.pathname !== "/") {
      if (mode === "always" && !url.pathname.endsWith("/")) {
        return ctx.redirect(`${url.pathname}/${url.search}`);
      } else if (
        mode === "never" && url.pathname.endsWith("/")
      ) {
        return ctx.redirect(`${url.pathname.slice(0, -1)}${url.search}`);
      }
    }
    return ctx.next();
  };
};
