import {
  type AnyComponent,
  type FunctionComponent,
  h,
  type RenderableProps,
  type VNode,
} from "preact";
import {
  FreshScripts,
  type RenderState,
  setRenderState,
} from "./runtime/server/preact_hooks.tsx";
import type { Context } from "./context.ts";
import { recordSpanError, tracer } from "./otel.ts";
import { DEV_ERROR_OVERLAY_URL } from "./constants.ts";
import { renderToString } from "preact-render-to-string";
import { BUILD_ID } from "./runtime/build_id.ts";

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

export function preactRender<State, Data>(
  vnode: VNode,
  ctx: PageProps<Data, State>,
  state: RenderState,
  headers: Headers,
) {
  try {
    let res = renderToString(vnode);
    // We require a the full outer DOM structure so that browser put
    // comment markers in the right place in the DOM.
    if (!state.renderedHtmlBody) {
      let scripts = "";
      if (ctx.url.pathname !== ctx.config.basePath + DEV_ERROR_OVERLAY_URL) {
        scripts = renderToString(h(FreshScripts, null));
      }
      res = `<body>${res}${scripts}</body>`;
    }
    if (!state.renderedHtmlHead) {
      res = `<head><meta charset="utf-8"></head>${res}`;
    }
    if (!state.renderedHtmlTag) {
      res = `<html>${res}</html>`;
    }

    return `<!DOCTYPE html>${res}`;
  } finally {
    // Add preload headers
    const basePath = ctx.config.basePath;
    const runtimeUrl = `${basePath}/_fresh/js/${BUILD_ID}/fresh-runtime.js`;
    let link = `<${encodeURI(runtimeUrl)}>; rel="modulepreload"; as="script"`;
    state.islands.forEach((island) => {
      link += `, <${
        encodeURI(`${basePath}${island.file}`)
      }>; rel="modulepreload"; as="script"`;
    });

    if (link !== "") {
      headers.append("Link", link);
    }

    state.clear();
    setRenderState(null);
  }
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
    req: ctx.request,
    state: ctx.state,
    url: ctx.url,
  };

  if (isAsyncAnyComponent(def.component)) {
    const result = await renderAsyncAnyComponent(def.component, vnodeProps);
    if (result instanceof Response) {
      return result;
    }

    return result;
  }

  return h(def.component, vnodeProps) as VNode;
}
