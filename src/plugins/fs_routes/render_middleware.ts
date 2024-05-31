import { type AnyComponent, h, type RenderableProps, type VNode } from "preact";
import type { MiddlewareFn } from "../../middlewares/mod.ts";
import type { HandlerFn, PageResponse } from "../../handlers.ts";
import type { FreshReqContext, PageProps } from "../../context.ts";
import { HttpError } from "../../error.ts";

export type AsyncAnyComponent<P> = {
  (
    props: RenderableProps<P>,
    // deno-lint-ignore no-explicit-any
    context?: any,
    // deno-lint-ignore no-explicit-any
  ): Promise<VNode<any> | Response | null>;
  displayName?: string;
  defaultProps?: Partial<P> | undefined;
};

export function renderMiddleware<State>(
  components: Array<
    | AnyComponent<PageProps<unknown, State>>
    | AsyncAnyComponent<PageProps<unknown, State>>
  >,
  handler: HandlerFn<unknown, State> | undefined,
  init?: ResponseInit | undefined,
): MiddlewareFn<State> {
  return async (ctx) => {
    let result: PageResponse<unknown> | undefined;
    if (handler !== undefined) {
      const res = await handler(ctx);

      if (res instanceof Response) {
        return res;
      }

      result = res;
    }

    if (components.length === 0) {
      throw new Error(`Did not receive any components to render.`);
    }

    const props = ctx as FreshReqContext<State>;
    props.data = result?.data;

    let vnode: VNode | null = null;
    for (let i = components.length - 1; i >= 0; i--) {
      const child = vnode;
      // FIXME: remove when we're using `<Slot />`
      props.Component = () => child;

      const fn = components[i];

      if (
        typeof fn === "function" &&
        fn.constructor.name === "AsyncFunction"
      ) {
        const result = (await fn(props)) as VNode | Response;
        if (result instanceof Response) {
          return result;
        }
        vnode = result;
      } else {
        // deno-lint-ignore no-explicit-any
        vnode = h(components[i] as any, props) as VNode;
      }
    }

    let status: number | undefined = init?.status ?? result?.status;
    if (
      ctx.error !== null && ctx.error !== undefined
    ) {
      if (
        ctx.error instanceof HttpError
      ) {
        status = ctx.error.status;
      } else {
        status = 500;
      }
    }

    return ctx.render(vnode!, {
      status,
      statusText: init?.statusText,
      headers: init?.headers ?? result?.headers,
    });
  };
}
