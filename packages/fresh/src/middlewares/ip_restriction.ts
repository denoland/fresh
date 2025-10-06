import type { Context } from "../context.ts";
import type { Middleware } from "./mod.ts";
import { isIPv4, isIPv6, matchSubnets } from "@std/net/unstable-ip";

export type AddressType = "IPv6" | "IPv4" | "none";
export interface IPRestrictionRules {
  denyList?: string[];
  allowList?: string[];
}

function buildMatcher(ipList: string[]) {
  return (addr: string) => {
    return matchSubnets(addr, ipList);
  };
}

function blockError(): Response {
  return new Response("Forbidden", {
    status: 403,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

function findType(addr: string): AddressType {
  if (isIPv4(addr)) {
    return "IPv4";
  } else if (isIPv6(addr)) {
    return "IPv6";
  }
  return "none";
}

export interface IpRestrictionOptions {
  onError?: <State>(
    remote: { addr: string; type: AddressType },
    ctx: Context<State>,
  ) => Response | Promise<Response>;
}

/**
 * IP Restriction Middleware for Fresh.
 *
 * @param rules rules `{ denyList: string[], allowList: string[] }`.
 * @param options Options for the IP Restriction middleware.
 * @returns The middleware handler function.
 *
 * @example Basic usage (with defaults)
 * ```ts
 * const app = new App<State>()
 *
 * app.use(ipRestriction({denyList: ["192.168.1.10", "2001:db8::1"]}))
 * ```
 *
 * @example custom error handling
 * ```ts
 * const customOnError: IpRestrictionOptions = {
 *   onError: () => {
 *     return new Response("custom onError", { status: 401 });
 *   },
 * };
 * app.use(ipRestriction({denyList: ["192.168.1.10", "2001:db8::1"]}, customOnError))
 * ```
 */
export function ipRestriction<State>(
  { denyList = [], allowList = [] }: IPRestrictionRules,
  options?: IpRestrictionOptions,
): Middleware<State> {
  const allowLength = allowList.length;

  const denyMatcher = buildMatcher(denyList);
  const allowMatcher = buildMatcher(allowList);

  return async function ipRestriction<State>(ctx: Context<State>) {
    if (ctx.info.remoteAddr.transport !== "tcp") {
      throw new TypeError(
        "Unsupported transport protocol. Only TCP is supported.",
      );
    }

    if (!ctx.info.remoteAddr.hostname) {
      return blockError();
    }

    const addr = ctx.info.remoteAddr.hostname == "localhost"
      ? "172.0.0.1"
      : ctx.info.remoteAddr.hostname;

    const type = findType(addr);
    if (type == "none") {
      return blockError();
    }

    if (denyMatcher(addr)) {
      if (options?.onError) {
        return options.onError({ addr, type }, ctx);
      }
      return blockError();
    }

    if (allowMatcher(addr)) {
      const res = await ctx.next();
      return res;
    }

    if (allowLength === 0) {
      return await ctx.next();
    } else {
      if (options?.onError) {
        return await options.onError({ addr, type }, ctx);
      }
      return blockError();
    }
  };
}
