import { h, VNode } from "preact";
import { Middleware } from "../compose.ts";
import { renderHtml } from "./render_html.ts";
import { AnyComponent } from "preact";

export const renderMiddleware =
  <T>(components: AnyComponent[]): Middleware<T> => async (ctx) => {
    if (components.length === 0) {
      throw new Error(`Did not receive any components to render.`);
    }

    let vnode: VNode | null = null;
    for (let i = components.length - 1; i >= 0; i--) {
      const child = vnode;
      const Component = () => child;
      // deno-lint-ignore no-explicit-any
      vnode = h(components[i] as any, {
        url: ctx.url,
        req: ctx.req,
        params: ctx.params,
        state: ctx.state,
        Component,
      }) as VNode;
    }

    const html = await renderHtml(ctx, vnode!);
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  };
