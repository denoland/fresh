// This module adds twind support.

import { setup, theme } from "../client_deps.ts";
import { RenderContext, RenderFn, virtualSheet } from "../server_deps.ts";

const sheet = virtualSheet();
sheet.reset();
setup({ sheet, theme });

export function render(ctx: RenderContext, render: RenderFn) {
  const snapshot = ctx.state.get("twindSnapshot") as unknown[] | null;
  sheet.reset(snapshot || undefined);
  render();
  ctx.styles.splice(0, ctx.styles.length, ...(sheet).target);
  const newSnapshot = sheet.reset();
  ctx.state.set("twindSnapshot", newSnapshot);
}
