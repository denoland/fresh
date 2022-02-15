import { RenderContext, RenderFn } from "../../../server.ts";

export function render(_ctx: RenderContext, render: RenderFn) {
  const body = render();
  if (!body) {
    throw new Error("body is missing");
  }
}
