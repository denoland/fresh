import { DENO_DEPLOYMENT_ID } from "./build_id.ts";
import { colors } from "./deps.ts";
import { ServeHandler } from "./types.ts";

export async function startServer(
  handler: Deno.ServeHandler,
  opts: Partial<Deno.ServeTlsOptions> & { basePath: string },
) {
  if (!opts.onListen) {
    opts.onListen = (params) => {
      const pathname = opts.basePath + "/";
      const address = colors.cyan(
        `http://localhost:${params.port}${pathname}`,
      );
      const localLabel = colors.bold("Local:");

      // Print more concise output for deploy logs
      if (DENO_DEPLOYMENT_ID) {
        console.log(
          colors.bgRgb8(colors.rgb8(" 🍋 Fresh ready ", 0), 121),
          `${localLabel} ${address}`,
        );
      } else {
        console.log();
        console.log(
          colors.bgRgb8(colors.rgb8(" 🍋 Fresh ready ", 0), 121),
        );
        console.log(`    ${localLabel} ${address}\n`);
      }
    };
  }

  const portEnv = Deno.env.get("PORT");
  if (portEnv !== undefined) {
    opts.port ??= parseInt(portEnv, 10);
  }

  let server: Deno.HttpServer | undefined;
  if (opts.port) {
    server = await bootServer(handler, opts);
  } else {
    // No port specified, check for a free port. Instead of picking just
    // any port we'll check if the next one is free for UX reasons.
    // That way the user only needs to increment a number when running
    // multiple apps vs having to remember completely different ports.
    let firstError;
    for (let port = 8000; port < 8020; port++) {
      try {
        server = await bootServer(handler, { ...opts, port });
        firstError = undefined;
        break;
      } catch (err) {
        if (err instanceof Deno.errors.AddrInUse) {
          // Throw first EADDRINUSE error
          // if no port is free
          if (!firstError) {
            firstError = err;
          }
          continue;
        }

        throw err;
      }
    }

    if (firstError) {
      throw firstError;
    }
    return server;
  }
}

async function bootServer(
  handler: ServeHandler,
  opts: Partial<Deno.ServeTlsOptions>,
) {
  if (typeof Deno.serve === "function") {
    return await Deno.serve(
      opts,
      (r, { remoteAddr }) =>
        handler(r, {
          remoteAddr,
          localAddr: {
            transport: "tcp",
            hostname: opts.hostname ?? "localhost",
            port: opts.port,
          } as Deno.NetAddr,
        }),
    );
  } else {
    // @ts-ignore Deprecated std serve way
    await serve(handler, opts);
  }
}
