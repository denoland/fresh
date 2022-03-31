import { RenderContext, RenderFn } from "../../../server.ts";

export async function render(_ctx: RenderContext, render: RenderFn) {
  await new Promise<void>((r) => r());
  const body = render();
  if (typeof body !== "string") {
    throw new Error("body is missing");
  }
}
