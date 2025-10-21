import type { Context } from "../context.ts";
import type { Middleware } from "./mod.ts";
import { isIPv4, isIPv6, matchSubnets } from "@std/net/unstable-ip";

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

function blockError(): Response {
  return new Response("Forbidden", { status: 403 });
}

function findType(
  addr: string,
): Deno.NetworkInterfaceInfo["family"] | undefined {
  if (isIPv4(addr)) {
    return "IPv4";
  } else if (isIPv6(addr)) {
    return "IPv6";
  }
  return undefined;
}

export interface ipFilterOptions {
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
 * @param rules rules `{ denyList: string[], allowList: string[] }`.
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
  return async function ipFilter<State>(ctx: Context<State>) {
    if (
      ctx.info.remoteAddr.transport !== "udp" &&
      ctx.info.remoteAddr.transport !== "tcp"
    ) {
      throw new TypeError(
        "Unsupported transport protocol. TCP & UDP is supported.",
      );
    }

    const addr = ctx.info.remoteAddr.hostname;
    const type = findType(addr);

    if (type == undefined) {
      return blockError();
    }

    if (matchSubnets(addr, rules.denyList || [])) {
      if (options?.onError) {
        return options.onError({ addr, type }, ctx);
      }
      return blockError();
    }

    if (matchSubnets(addr, rules.allowList || [])) {
      return ctx.next();
    }

    if ((rules.allowList || []).length === 0) {
      return ctx.next();
    } else {
      if (options?.onError) {
        return options.onError({ addr, type }, ctx);
      }
      return blockError();
    }
  };
}
