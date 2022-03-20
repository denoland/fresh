// This module adds twind support.

import { setup } from "../client_deps.ts";
import { RenderContext, RenderFn, virtualSheet } from "../server_deps.ts";

const sheet = virtualSheet();
sheet.reset();
// @ts-expect-error `Type 'VirtualSheet' is missing the following properties from type 'Sheet<unknown>': target, insert`. A virtualSheet has these properties. ts bug ? 
setup({ sheet });

export function render(ctx: RenderContext, render: RenderFn) {
  const snapshot = ctx.state.get("twindSnapshot") as unknown[] | null;
  sheet.reset(snapshot || undefined);
  render();
  // @ts-expect-error `Type 'VirtualSheet' is missing the following properties from type 'Sheet<unknown>': target, insert`.
  ctx.styles.splice(0, ctx.styles.length, ...(sheet).target);
  const newSnapshot = sheet.reset();
  ctx.state.set("twindSnapshot", newSnapshot);
}
