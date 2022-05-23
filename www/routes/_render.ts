// This module adds twind support.

import { RenderContext, RenderFn } from "$fresh/server.ts";
import { setup, theme } from "../utils/twind.ts";
import { virtualSheet } from "$twind/sheets";

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
