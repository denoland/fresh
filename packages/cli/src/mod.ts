import { parseArgs } from "@std/cli";
import { createServer, type RunnableDevEnvironment } from "vite";
import * as cl from "@std/fmt/colors";
import { version } from "fresh/internal-dev";
import { IncomingMessage, Server } from "node:http";
import type { AddressInfo } from "node:net";
import { toAbsolutePath } from "./utils.ts";
import { fresh } from "@fresh/plugin-vite";
import path from "node:path";
import { FreshServerEntryMod } from "./config.ts";

export interface CliArgs {
  command: "dev" | "build" | "preview";
  cwd: string;
}

export function parseCliArgs(args: string[], cwd = Deno.cwd()): CliArgs {
  const parsed = parseArgs(args, {});

  let command: CliArgs["command"] = "dev";

  if (parsed._.length > 0) {
    if (parsed._[0] === "build") {
      command = "build";
    } else if (parsed._[0] === "preview") {
      command = "preview";
    } else {
      cwd = toAbsolutePath(String(parsed._[0]), cwd);
    }
  }

  return {
    command,
    cwd,
  };
}

export async function runCli(args: string[]) {
  const startTime = performance.now();

  const parsed = parseCliArgs(args);

  console.log({ parsed });

  if (parsed.command === "dev") {
    const viteServer = (await createServer({
      server: { middlewareMode: true },
      appType: "custom",
      plugins: [
        fresh({
          serverEntry: path.join(parsed.cwd, "main.ts"),
          islandsDir: path.join(parsed.cwd, "islands"),
          routeDir: path.join(parsed.cwd, "routes"),
        }),
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
      // We're proxying the request to the vite http server because
      // that's the easiest way to turn a `Request` into a node
      // request (=`IncomingMessage`) instance.
      const url = new URL(
        req.url,
        `http://${proxyAddr.address}:${proxyAddr.port}`,
      );
      url.hostname = proxyAddr.address;
      url.port = String(proxyAddr.port);
      const res = await fetch(url, req);

      if (res.status === 404) {
        const mod = await serverEnv.runner.import(
          "fresh:server_entry",
        ) as FreshServerEntryMod;

        const res = await mod.default.fetch(req);
        console.log({ mod: mod.default, r2: res.status, req: req.url });

        return res;
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
