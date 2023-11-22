import { defineConfig } from "$fresh/src/server/defines.ts";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let called = false;
export default defineConfig({
  plugins: [
    {
      name: "a",
      async configResolved() {
        await delay(1);
        called = true;
      },
      middlewares: [
        {
          path: "/",
          middleware: {
            handler: async (_req, ctx) => {
              const res = await ctx.next();
              res.headers.append("X-Plugin-A", String(called));
              return res;
            },
          },
        },
      ],
    },
  ],
});
