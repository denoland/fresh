import type { Context } from "../context.ts";
import type { Middleware } from "./mod.ts";
import { isIPv4, matchSubnets } from "@std/net/unstable-ip";

/**
 * Configuration rules for IP restriction middleware.
 */
export interface IpFilterRules {
  /**
   * List of IP addresses or CIDR blocks to deny access.
   * If an IP matches any entry in this list, access will be blocked.
   *
   * @example ["192.168.1.10", "10.0.0.0/8", "2001:db8::1"]
   */
  denyList?: string[];

  /**
   * List of IP addresses or CIDR blocks to allow access.
   * If specified, only IPs matching entries in this list will be allowed.
   * If empty or undefined, all IPs are allowed (unless in denyList).
   *
   * @example ["192.168.1.0/24", "203.0.113.0/24", "2001:db8::/32"]
   */
  allowList?: string[];
}

export interface ipFilterOptions {
  /**
   * Called when a request is blocked by the IP filter.
   *
   * The function receives the remote information and the current request
   * context and should return a Response (or a Promise resolving to one)
   * which will be sent back to the client. If not provided, a default
   * 403 Forbidden response will be used.
   *
   * Parameters:
   * - `remote.addr` - the remote IP address as a string.
   * - `remote.type` - the network family: "IPv4", "IPv6", or `undefined`.
   * - `ctx` - the request `Context` which can be used to inspect the
   *   request or produce a custom response.
   *
   * @example
   * ```ts
   * const options: ipFilterOptions = {
   *   onError: (remote, ctx) => {
   *     console.log(`Blocked ${remote.addr} (${remote.type})`, ctx.url);
   *     return new Response("Access denied", { status: 401 });
   *   },
   * };
   * ```
   */
  onError?: <State>(
    remote: {
      addr: string;
      type: Deno.NetworkInterfaceInfo["family"] | undefined;
    },
    ctx: Context<State>,
  ) => Response | Promise<Response>;
}

/**
 * IP restriction Middleware for Fresh.
 *
 * @param rules Deny and allow rules object.
 * @param options Options for the IP Restriction middleware.
 * @returns The middleware handler function.
 *
 * @example Basic usage (with defaults)
 * ```ts
 * const app = new App<State>()
 *
 * app.use(ipFilter({
 *   denyList: ["192.168.1.10", "2001:db8::1"]
 * }));
 * ```
 *
 * @example Custom error handling
 * ```ts
 * const customOnError: ipFilterOptions = {
 *   onError: (remote, ctx) => {
 *     console.log(
 *       `Request URL: ${ctx.url}, Blocked IP: ${remote.addr} of type ${remote.type}`,
 *     );
 *
 *     return new Response("custom onError", { status: 401 });
 *   },
 * };
 * app.use(ipFilter({
 *   denyList: ["192.168.1.10", "2001:db8::1"]
 * }, customOnError));
 * ```
 */
export function ipFilter<State>(
  rules: IpFilterRules,
  options?: ipFilterOptions,
): Middleware<State> {
  const onBlock = options?.onError ??
    (() => new Response("Forbidden", { status: 403 }));
  return function ipFilter<State>(ctx: Context<State>) {
    if (
      ctx.info.remoteAddr.transport !== "udp" &&
      ctx.info.remoteAddr.transport !== "tcp"
    ) {
      return ctx.next();
    }

    const addr = ctx.info.remoteAddr.hostname;
    const type = isIPv4(addr) ? "IPv4" : "IPv6";

    if (matchSubnets(addr, rules.denyList || [])) {
      return onBlock({ addr, type }, ctx);
    }

    if (
      (rules.allowList || []).length === 0 ||
      matchSubnets(addr, rules.allowList || [])
    ) {
      return ctx.next();
    }

    return onBlock({ addr, type }, ctx);
  };
}
