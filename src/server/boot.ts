import { colors } from "./deps.ts";
import { ServeHandler } from "./types.ts";

export async function startServer(
  handler: Deno.ServeHandler,
  opts: Partial<Deno.ServeTlsOptions>,
) {
  if (!opts.onListen) {
    opts.onListen = (params) => {
      console.log();
      console.log(
        colors.bgRgb8(colors.black(colors.bold(" 🍋 Fresh ready ")), 121),
      );

      const address = colors.cyan(`http://localhost:${params.port}/`);
      const localLabel = colors.bold("Local:");
      console.log(`    ${localLabel} ${address}\n`);
    };
  }

  const portEnv = Deno.env.get("PORT");
  if (portEnv !== undefined) {
    opts.port ??= parseInt(portEnv, 10);
  }

  if (opts.port) {
    await bootServer(handler, opts);
  } else {
    // No port specified, check for a free port. Instead of picking just
    // any port we'll check if the next one is free for UX reasons.
    // That way the user only needs to increment a number when running
    // multiple apps vs having to remember completely different ports.
    let firstError;
    for (let port = 8000; port < 8020; port++) {
      try {
        await bootServer(handler, { ...opts, port });
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
  }
}

async function bootServer(
  handler: ServeHandler,
  opts: Partial<Deno.ServeTlsOptions>,
) {
  if (typeof Deno.serve === "function") {
    const defaultServeHandler: Deno.ServeHandler = (r, { remoteAddr }) => {
      const forwarded = r.headers.get("X-Forwarded-For");
      const forwardedForAddr: Deno.NetAddr | undefined = forwarded
        ? {
          transport: remoteAddr.transport,
          hostname: forwarded,
          port: remoteAddr.port,
        }
        : undefined;
      return handler(r, {
        remoteAddr,
        localAddr: {
          transport: "tcp",
          hostname: opts.hostname ?? "localhost",
          port: opts.port,
        } as Deno.NetAddr,
        forwardedForAddr,
      });
    };
    await Deno.serve(opts, defaultServeHandler).finished;
  } else {
    // @ts-ignore Deprecated std serve way
    await serve(handler, opts);
  }
}
