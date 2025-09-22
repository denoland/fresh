import { serve } from "../src/serve.ts";
import * as cl from "@std/fmt/colors";
import * as path from "@std/path";

const fetcher = await serve({
  root: path.join(import.meta.dirname!, "..", "..", "..", "www"),
  environments: {
    ssr: {
      build: {
        input: ["fresh:ssr-entry"],
        outDir: "dist/server",
      },
      plugins: [
        {
          name: "fresh:ssr",
          setup(ctx) {
            ctx.server.use(async (req, next) => {
              const res = await next();

              if (res.status === 404) {
                const mod = await ctx.server.loadModule(
                  "ssr",
                  "fresh:ssr-entry",
                );

                console.log("SSR", mod);

                return mod.fetch(req);
              }

              return res;
            });

            ctx.onResolve({ id: /fresh:ssr-entry/ }, (args) => {
              return {
                id: args.id,
              };
            });

            ctx.onLoad({ id: "/fresh:ssr-entry/" }, (args) => {
              return {
                code: `export default {
                async fetch(req) {
                  console.log("hello")
                  return new Response("ok")
                }
              }`,
                loader: "js",
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

            ctx.onLoad({ id: /fresh:client-entry/ }, (args) => {
              return {
                code: "console.log('client')",
                loader: "js",
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
