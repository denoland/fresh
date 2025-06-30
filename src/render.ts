import { SpanStatusCode } from "@opentelemetry/api";
import { AnyComponent, h, VNode } from "preact";
import {
  AsyncAnyComponent,
  isAsyncAnyComponent,
} from "./plugins/fs_routes/render_middleware.ts";
import { HandlerFn, PageResponse } from "./handlers.ts";
import { FreshContext, PageProps } from "./context.ts";
import { recordSpanError, tracer } from "./otel.ts";

export async function renderSegment<State>(
  ctx: FreshContext<State>,
  components: AnyComponent<PageProps<unknown, State>>[],
): Promise<Response> {
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
            recordSpanError(span, err);
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
}
