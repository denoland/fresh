import { type AnyComponent, h, type RenderableProps, type VNode } from "preact";
import type { MiddlewareFn } from "../../middlewares/mod.ts";
import type { HandlerFn, PageResponse } from "../../handlers.ts";
import type { FreshReqContext, PageProps } from "../../context.ts";
import { HttpError } from "../../error.ts";
import { tracer } from "../../otel.ts";
import { SpanStatusCode } from "@opentelemetry/api";

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

// deno-lint-ignore no-explicit-any
export function isAsyncAnyComponent(fn: any): fn is AsyncAnyComponent<any> {
  return typeof fn === "function" && fn.constructor.name === "AsyncFunction";
}

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
      const res = await tracer.startActiveSpan("handler", {
        attributes: { "fresh.span_type": "fs_routes/handler" },
      }, async (span) => {
        try {
          const res = await handler(ctx);
          span.setAttribute(
            "fresh.handler_response",
            res instanceof Response ? "http" : "data",
          );
          return res;
        } catch (err) {
          if (err instanceof Error) {
            span.recordException(err);
          } else {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: String(err),
            });
          }
          throw err;
        } finally {
          span.end();
        }
      });

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

      if (isAsyncAnyComponent(fn)) {
        const result = await tracer.startActiveSpan(
          "invoke async component",
          async (span) => {
            span.setAttribute("fresh.span_type", "fs_routes/async_component");
            try {
              const result = (await fn(props)) as VNode | Response;
              span.setAttribute(
                "fresh.component_response",
                result instanceof Response ? "http" : "jsx",
              );
              return result;
            } catch (err) {
              if (err instanceof Error) {
                span.recordException(err);
              } else {
                span.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: String(err),
                });
              }
              throw err;
            } finally {
              span.end();
            }
          },
        );
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
