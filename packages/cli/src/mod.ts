import { parseArgs } from "@std/cli";
import { createServer, RunnableDevEnvironment } from "vite";
import * as cl from "@std/fmt/colors";
import { version } from "fresh/internal-dev";
import { IncomingMessage, Server } from "node:http";
import { AddressInfo } from "node:net";

export interface CliArgs {
  command: "dev" | "build" | "preview";
}

export function parseCliArgs(args: string[]): CliArgs {
  const parsedArgs = parseArgs(args, {});

  return {
    command: "dev",
  };
}

export async function runCli(args: string[]) {
  const startTime = performance.now();

  const parsed = parseCliArgs(args);

  const command = "dev";

  if (parsed.command === "dev") {
    const viteServer = (await createServer({
      server: { middlewareMode: true },
      plugins: [
        {
          name: "foo",
          configureServer(server) {
            let org = server.printUrls;
            server.printUrls = () => {
              org();
              console.log("inner");
            };
          },
        },
      ],
    }))!;

    const proxy = new Server((req, res) => {
      viteServer.middlewares(req, res);
    });

    const listening = Promise.withResolvers<AddressInfo>();
    proxy.listen(0, "localhost", () => {
      const addr = proxy.address();
      if (addr === null) {
        throw new Error(`Unable to create node server.`);
      } else if (typeof addr === "string") {
        throw new Error(`Expected an object for address.`);
      }

      console.log(addr);
      listening.resolve(addr);
    });

    const proxyAddr = await listening.promise;

    const serverEnv = viteServer.environments.ssr as RunnableDevEnvironment;

    const server = Deno.serve(async (req) => {
      const url = new URL(
        req.url,
        `http://${proxyAddr.address}:${proxyAddr.port}`,
      );
      url.hostname = proxyAddr.address;
      url.port = String(proxyAddr.port);

      const clone = req.clone();
      const res = await fetch(url, clone);

      console.log(url.href, proxyAddr, req.url);

      console.log(await res.text(), res.status);

      if (res.status === 404) {
        const mod = await serverEnv.runner.import("fresh:server_entry");
      }

      return res;
    });

    let org = viteServer.printUrls;
    viteServer.resolvedUrls = { local: ["http://localhost:8000"], network: [] };
    viteServer.printUrls = () => {
      org();
      console.log("PRINT");
    };
    // await server.listen();
    console.log(viteServer.resolvedUrls);

    const info = viteServer.config.logger.info;
    const startupDurationString = cl.dim(
      `ready in ${
        cl.reset(cl.bold(String(Math.ceil(performance.now() - startTime))))
      } ms`,
    );

    const label = cl.bgRgb8(
      `${cl.rgb8(` 🍋 Fresh ${version} `, 0)}`,
      121,
    );
    info("");
    info(`${label} ${startupDurationString}\n`);

    viteServer.printUrls();
    viteServer.bindCLIShortcuts({ print: true });
  }
}
