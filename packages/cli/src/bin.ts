import { serve } from "../src/serve.ts";
import * as cl from "@std/fmt/colors";
import * as path from "@std/path";

const fetcher = await serve({
  root: path.join(import.meta.dirname!, "..", "..", "..", "www"),
  environments: {
    ssr: {
      build: {
        input: ["fresh:server-entry"],
        outDir: "dist/server",
      },
      plugins: [
        {
          name: "fresh:ssr",
          setup(ctx) {
            ctx.server?.use(async (_req, next) => {
              const res = await next();

              if (res.status === 404) {
                const mod = await ctx.server!.loadModule(
                  "ssr",
                  "fresh:ssr-entry",
                );
              }

              return res;
            });

            ctx.onResolve({ id: /fresh:ssr-entry/ }, (args) => {
              console.log("ssr resolve", args);
              return {
                id: args.id,
              };
            });
          },
        },
      ],
    },
    client: {
      build: {
        input: ["fresh:client-entry"],
        outDir: "dist/client",
      },
      plugins: [
        {
          name: "fresh:client",
          setup(ctx) {
            ctx.onResolve({ id: /fresh:client-entry/ }, (args) => {
              console.log("client resolve", args);
              return {
                id: args.id,
              };
            });
          },
        },
      ],
    },
  },
  plugins: [],
}, Deno.cwd());

Deno.serve({
  port: 4000,
  hostname: "localhost",
  onListen(addr) {
    const hostname = addr.hostname === "::1" ? "localhost" : addr.hostname;

    const url = cl.cyan(`http://${hostname}:${addr.port}`);

    // deno-lint-ignore no-console
    console.log(`Fresh ready`);
    // deno-lint-ignore no-console
    console.log(`  Local:   ${url}`);
    // deno-lint-ignore no-console
    console.log(`  Network: Pass --host`);
  },
}, fetcher);
