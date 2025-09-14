import {
  type AnyComponent,
  type FunctionComponent,
  h,
  type RenderableProps,
  type VNode,
} from "preact";
import type { Context } from "./context.ts";
import { recordSpanError, tracer } from "./otel.ts";

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

export async function renderAsyncAnyComponent<Props>(
  fn: AsyncAnyComponent<Props>,
  props: RenderableProps<Props>,
) {
  return await tracer.startActiveSpan(
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
}

export type PageProps<Data = unknown, T = unknown> =
  & Pick<
    Context<T>,
    | "config"
    | "url"
    | "req"
    | "params"
    | "info"
    | "state"
    | "isPartial"
    | "Component"
    | "error"
    | "route"
  >
  & { data: Data };

export interface ComponentDef<Data, State> {
  props: PageProps<Data, State> | null;
  component: AnyComponent<PageProps<Data, State>>;
}

export async function renderRouteComponent<State>(
  ctx: Context<State>,
  def: ComponentDef<unknown, State>,
  child: FunctionComponent,
): Promise<VNode | Response> {
  const vnodeProps: PageProps<unknown, State> = {
    Component: child,
    config: ctx.config,
    data: def.props,
    error: ctx.error,
    info: ctx.info,
    isPartial: ctx.isPartial,
    params: ctx.params,
    req: ctx.req,
    state: ctx.state,
    url: ctx.url,
    route: ctx.route,
  };

  // Try to call as a function first (handle "() => Promise.resolve" directly)
  let result;
  try {
    result = (def.component as any)(vnodeProps);
  } catch {
    // fallback to h()
    result = h(def.component, vnodeProps);
  }
  if (typeof result?.then === "function") {
    const awaited = await result;
    if (awaited instanceof Response) return awaited;
    return awaited;
  }
  return result as VNode;
}
