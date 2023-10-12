import { ServeHandlerInfo } from "./types.ts";

// deno-lint-ignore no-explicit-any
export interface ComposeCtx<S = any> extends ServeHandlerInfo {
  state: S;
  url: URL;
  params: Record<string, string>;
  route: {
    matched: string;
    remaining: string;
  };
  next(): Promise<Response>;
}

// deno-lint-ignore no-explicit-any
export type ComposeHandler<S = any> = (
  req: Request,
  ctx: ComposeCtx<S>,
) => Promise<Response> | Response;

// Inspired by koa-compose which is licensed as MIT https://github.com/koajs/compose/blob/bff06e965caa71f3a1f4f6f6811290f7863c77ba/index.js#L31
// deno-lint-ignore no-explicit-any
export function compose<S = any>(handlers: ComposeHandler<S>[]) {
  return (req: Request, ctx: ComposeCtx<S>) => {
    const originalNext = ctx.next;

    function dispatch(i: number) {
      const fn = handlers[i];
      const next = i === handlers.length - 1
        ? originalNext
        : dispatch.bind(null, i + 1);

      ctx.next = next;

      try {
        return Promise.resolve(fn(req, ctx));
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
}
