import type { HandlerFn } from "@fresh/core";

export const handler: HandlerFn<null, { text: string }> = (ctx) =>
  new Response(ctx.state.text);
