import { type AnyComponent, h, type RenderableProps, type VNode } from "preact";
import type { MiddlewareFn } from "../../middlewares/mod.ts";
import type { HandlerFn, PageResponse } from "../../handlers.ts";
import type { PageProps } from "../../runtime/server/mod.tsx";

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
): MiddlewareFn<State> {
  return async (ctx) => {
    let result: PageResponse<unknown> | undefined;
    if (handler !== undefined) {
      const res = await handler(ctx);

      if (res instanceof Response) {
        return res;
      }

      // deno-lint-ignore no-explicit-any
      result = res as any;
    }

    if (components.length === 0) {
      throw new Error(`Did not receive any components to render.`);
    }

    let vnode: VNode | null = null;
    for (let i = components.length - 1; i >= 0; i--) {
      const child = vnode;
      const Component = () => child;

      const fn = components[i];

      if (
        typeof fn === "function" &&
        fn.constructor.name === "AsyncFunction"
      ) {
        const result = (await fn({ ...ctx, Component })) as VNode | Response;
        if (result instanceof Response) {
          return result;
        }
        vnode = result;
      } else {
        // deno-lint-ignore no-explicit-any
        vnode = h(components[i] as any, {
          config: ctx.config,
          url: ctx.url,
          req: ctx.req,
          params: ctx.params,
          state: ctx.state,
          Component,
          error: ctx.error,
          data: result?.data ?? {},
        }) as VNode;
      }
    }

    return ctx.render(vnode!);
  };
}
