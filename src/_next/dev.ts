import { FreshApp, ListenOptions } from "./app.ts";
import { setMode } from "./options.ts";

setMode("dev");

// Patch .listen() during dev
const originalListen = FreshApp.prototype.listen;
FreshApp.prototype.listen = async function (
  options: ListenOptions = {},
) {
  if (options.hostname === undefined) {
    options.hostname = "localhost";
  }
  if (options.port === undefined) {
    options.port = await getFreePort(8000, options.hostname);
  }

  return originalListen.call(this, options);
};

export function getFreePort(
  startPort: number,
  hostname: string,
): number {
  // No port specified, check for a free port. Instead of picking just
  // any port we'll check if the next one is free for UX reasons.
  // That way the user only needs to increment a number when running
  // multiple apps vs having to remember completely different ports.
  let firstError;
  for (let port = startPort; port < startPort + 20; port++) {
    try {
      const listener = Deno.listen({ port, hostname });
      listener.close();
      return port;
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

  throw firstError;
}
