import { FreshContext } from "../../context.ts";
import { RenderState } from "./render_state.ts";
import { renderToStringAsync } from "https://esm.sh/*preact-render-to-string@6.4.0";

import "./preact_hooks.ts";
import { type VNode } from "preact";

export async function renderHtml(
  ctx: FreshContext,
  vnode: VNode,
): Promise<string> {
  const state = new RenderState(ctx);

  return await renderToStringAsync(vnode, { __fresh: state });
}
