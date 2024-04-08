import { defineConfig } from "$fresh/server.ts";

export default defineConfig({
  plugins: [
    {
      name: "html inject",
      async renderAsync(ctx) {
        await ctx.renderAsync();
        return {
          htmlText: "<h1>it works</h1>",
        };
      },
    },
  ],
});
