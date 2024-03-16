import { h, VNode } from "preact";
import { Middleware } from "../compose.ts";
import { renderHtml } from "./render_html.ts";
import { AnyComponent } from "preact";
import { HandlerFn, Render } from "../../defines.ts";
import { FreshContext } from "../../context.ts";

export const renderMiddleware = <T>(
  components: AnyComponent<FreshContext<T>>[],
  handler: HandlerFn<unknown, T> | undefined,
): Middleware<T> =>
async (ctx) => {
  let result: Render<T> | undefined;
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

  const html = await renderHtml(ctx, vnode!);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
};
