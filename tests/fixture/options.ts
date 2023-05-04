import { FreshOptions } from "$fresh/server.ts";

export default {
  async render(_ctx, render) {
    await new Promise<void>((r) => r());
    const body = await render();
    if (typeof body !== "string") {
      throw new Error("body is missing");
    }
  },
} as FreshOptions;
