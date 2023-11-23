import { colors, parse } from "./deps.ts";
import { ServeHandler } from "./types.ts";

const onListen =
  (opts: Partial<Deno.ServeTlsOptions>) =>
  (params: { hostname: string; port: number }) => {
    const address = colors.cyan(
      `http://${opts.hostname || params.hostname}:${opts.port || params.port}/`,
    );
    console.log(
      "\n",
      colors.bgRgb8(colors.rgb8(" 🍋 Fresh ready ", 0), 121),
      `\n    ${colors.bold("Local:")} ${address}\n\n`,
    );
  };

export async function startServer(
  handler: Deno.ServeHandler,
  opts: Partial<Deno.ServeTlsOptions>,
) {
  const { host: hostFlag, port: portFlag } = parse(Deno.args, {
    string: ["host", "port"],
    alias: { h: "host", p: "port" },
  });
  const portEnv = Deno.env.get("PORT");
  const hostEnv = Deno.env.get("HOST");

  if (portEnv !== undefined || portFlag !== undefined) {
    opts.port = parseInt((portFlag || portEnv) as string, 10);
  }

  if (hostEnv !== undefined || hostFlag !== undefined) {
    opts.hostname = hostFlag || hostEnv;
  }

  if (!opts.onListen) {
    opts.onListen = onListen(opts);
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
  // @ts-ignore Ignore type error when type checking with Deno versions
  if (typeof Deno.serve === "function") {
    // @ts-ignore Ignore type error when type checking with Deno versions
    await Deno.serve(
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
    ).finished;
  } else {
    // @ts-ignore Deprecated std serve way
    await serve(handler, opts);
  }
}
