// This module adds twind support.

import { virtualSheet } from "https://esm.sh/twind/sheets";
import { setup } from "../deps.ts";
import { RenderContext, RenderFn } from "../server_deps.ts";

const sheet = virtualSheet();
sheet.reset();
setup({ sheet });

export function render(ctx: RenderContext, render: RenderFn) {
  const snapshot = ctx.state.get("twindSnapshot") as unknown[] | null;
  sheet.reset(snapshot || undefined);
  render();
  ctx.styles.splice(0, ctx.styles.length, ...sheet.target);
  const newSnapshot = sheet.reset();
  ctx.state.set("twindSnapshot", newSnapshot);
}
