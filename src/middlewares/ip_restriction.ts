import type { FreshContext } from "../context.ts";
import type { MiddlewareFn } from "./mod.ts";

export type AddressType = "IPv4" | "IPv6";

export type NetAddrInfo = {
  /**
   * Transport protocol type
   */
  transport?: "tcp" | "udp";
  /**
   * Transport port number
   */
  port: number;
  address: string;
  addressType?: AddressType;
};

export interface ConnInfo {
  /**
   * Remote information
   */
  remote: NetAddrInfo;
}

/**
 * Helper type
 */
export type GetConnInfo = (c: FreshContext) => ConnInfo;

/**
 * Expand IPv6 Address
 * @param ipV6 Shorten IPv6 Address
 * @return expanded IPv6 Address
 */

export const expandIPv6 = (ipV6: string): string => {
  const sections = ipV6.split(":");
  if (IPV4_REGEX.test(sections.at(-1) as string)) {
    sections.splice(
      -1,
      1,
      ...convertIPv6BinaryToString(
        convertIPv4ToBinary(sections.at(-1) as string),
      ) // => ::7f00:0001
        .substring(2) // => 7f00:0001
        .split(":"), // => ['7f00', '0001']
    );
  }
  for (let i = 0; i < sections.length; i++) {
    const node = sections[i];
    if (node !== "") {
      sections[i] = node.padStart(4, "0");
    } else {
      sections[i + 1] === "" && sections.splice(i + 1, 1);
      sections[i] = new Array(8 - sections.length + 1).fill("0000").join(":");
    }
  }
  return sections.join(":");
};

const IPV4_REGEX = /^[0-9]{0,3}\.[0-9]{0,3}\.[0-9]{0,3}\.[0-9]{0,3}$/;

/**
 * Returns the address type ("IPv4" or "IPv6") for a given remote address string.
 *
 * @param remoteAddr - The remote address as a string.
 * @returns The address type ("IPv4" | "IPv6") or undefined if not recognized.
 */
export const distinctRemoteAddr = (
  remoteAddr: string,
): AddressType | undefined => {
  if (IPV4_REGEX.test(remoteAddr)) {
    return "IPv4";
  }
  if (remoteAddr.includes(":")) {
    return "IPv6";
  }
};

/**
 * Converts an IPv4 address string to a bigint binary representation.
 *
 * @param ipv4 - The IPv4 address as a string (e.g., "192.168.0.1").
 * @returns The IPv4 address as a bigint.
 */
export const convertIPv4ToBinary = (ipv4: string): bigint => {
  const parts = ipv4.split(".");
  let result = 0n;
  for (let i = 0; i < 4; i++) {
    result <<= 8n;
    result += BigInt(parts[i]);
  }
  return result;
};

/**
 * Converts an IPv6 address string to a bigint binary representation.
 *
 * @param ipv6 - The IPv6 address as a string (e.g., "2001:db8::1").
 * @returns The IPv6 address as a bigint.
 */
export const convertIPv6ToBinary = (ipv6: string): bigint => {
  const sections = expandIPv6(ipv6).split(":");
  let result = 0n;
  for (let i = 0; i < 8; i++) {
    result <<= 16n;
    result += BigInt(parseInt(sections[i], 16));
  }
  return result;
};

/**
 * Converts a binary representation of an IPv4 address to its string form.
 *
 * @param ipV4 - The IPv4 address as a bigint.
 * @returns The IPv4 address as a string (e.g., "192.168.0.1").
 */
export const convertIPv4BinaryToString = (ipV4: bigint): string => {
  const sections = [];
  for (let i = 0; i < 4; i++) {
    sections.push((ipV4 >> BigInt(8 * (3 - i))) & 0xffn);
  }
  return sections.join(".");
};

/**
 * Converts a binary representation of an IPv6 address to its normalized string form.
 *
 * @param ipV6 - The IPv6 address as a bigint.
 * @returns The normalized IPv6 address as a string (e.g., "2001:db8::1").
 */
export const convertIPv6BinaryToString = (ipV6: bigint): string => {
  // IPv6-mapped IPv4 address
  if (ipV6 >> 32n === 0xffffn) {
    return `::ffff:${convertIPv4BinaryToString(ipV6 & 0xffffffffn)}`;
  }

  const sections = [];
  for (let i = 0; i < 8; i++) {
    sections.push(((ipV6 >> BigInt(16 * (7 - i))) & 0xffffn).toString(16));
  }

  let currentZeroStart = -1;
  let maxZeroStart = -1;
  let maxZeroEnd = -1;
  for (let i = 0; i < 8; i++) {
    if (sections[i] === "0") {
      if (currentZeroStart === -1) {
        currentZeroStart = i;
      }
    } else {
      if (currentZeroStart > -1) {
        if (i - currentZeroStart > maxZeroEnd - maxZeroStart) {
          maxZeroStart = currentZeroStart;
          maxZeroEnd = i;
        }
        currentZeroStart = -1;
      }
    }
  }
  if (currentZeroStart > -1) {
    if (8 - currentZeroStart > maxZeroEnd - maxZeroStart) {
      maxZeroStart = currentZeroStart;
      maxZeroEnd = 8;
    }
  }
  if (maxZeroStart !== -1) {
    sections.splice(maxZeroStart, maxZeroEnd - maxZeroStart, ":");
  }

  return sections.join(":").replace(/:{2,}/g, "::");
};

/**
 * ### IPv4 and IPv6
 * - `*` match all
 *
 * ### IPv4
 * - `192.168.2.0` static
 * - `192.168.2.0/24` CIDR Notation
 *
 * ### IPv6
 * - `::1` static
 * - `::1/10` CIDR Notation
 */
/**
 * Type for a function that matches an IP restriction rule.
 *
 * @param addr - The address and its type to check.
 * @returns True if the rule matches, false otherwise.
 */
type IPRestrictionRuleFunction = (
  addr: { addr: string; type: AddressType },
) => boolean;

/**
 * IP restriction rule, which can be a string or a function.
 */
export type IPRestrictionRule =
  | string
  | ((addr: { addr: string; type: AddressType }) => boolean);

const IS_CIDR_NOTATION_REGEX = /\/[0-9]{0,3}$/;
const buildMatcher = (
  rules: IPRestrictionRule[],
): (addr: { addr: string; type: AddressType; isIPv4: boolean }) => boolean => {
  const functionRules: IPRestrictionRuleFunction[] = [];
  const staticRules: Set<string> = new Set();
  const cidrRules: [boolean, bigint, bigint][] = [];

  for (let rule of rules) {
    if (rule === "*") {
      return () => true;
    } else if (typeof rule === "function") {
      functionRules.push(rule);
    } else {
      if (IS_CIDR_NOTATION_REGEX.test(rule)) {
        const separatedRule = rule.split("/");

        const addrStr = separatedRule[0];
        const type = distinctRemoteAddr(addrStr);
        if (type === undefined) {
          throw new TypeError(`Invalid rule: ${rule}`);
        }

        const isIPv4 = type === "IPv4";
        const prefix = parseInt(separatedRule[1]);

        if (isIPv4 ? prefix === 32 : prefix === 128) {
          // this rule is a static rule
          rule = addrStr;
        } else {
          const addr = (isIPv4 ? convertIPv4ToBinary : convertIPv6ToBinary)(
            addrStr,
          );
          const mask = ((1n << BigInt(prefix)) - 1n) <<
            BigInt((isIPv4 ? 32 : 128) - prefix);

          cidrRules.push(
            [isIPv4, addr & mask, mask] as [boolean, bigint, bigint],
          );
          continue;
        }
      }

      const type = distinctRemoteAddr(rule);
      if (type === undefined) {
        throw new TypeError(`Invalid rule: ${rule}`);
      }
      staticRules.add(
        type === "IPv4"
          ? rule // IPv4 address is already normalized, so it is registered as is.
          : convertIPv6BinaryToString(convertIPv6ToBinary(rule)), // normalize IPv6 address (e.g. 0000:0000:0000:0000:0000:0000:0000:0001 => ::1)
      );
    }
  }

  return (remote: {
    addr: string;
    type: AddressType;
    isIPv4: boolean;
    binaryAddr?: bigint;
  }): boolean => {
    if (staticRules.has(remote.addr)) {
      return true;
    }
    for (const [isIPv4, addr, mask] of cidrRules) {
      if (isIPv4 !== remote.isIPv4) {
        continue;
      }
      const remoteAddr = (remote.binaryAddr ||= (
        isIPv4 ? convertIPv4ToBinary : convertIPv6ToBinary
      )(remote.addr));
      if ((remoteAddr & mask) === addr) {
        return true;
      }
    }
    for (const rule of functionRules) {
      if (rule({ addr: remote.addr, type: remote.type })) {
        return true;
      }
    }
    return false;
  };
};

/**
 * Interface for configuring IP restriction middleware rules.
 *
 * @property denyList - List of rules to explicitly deny.
 * @property allowList - List of rules to explicitly allow.
 */
export interface IPRestrictionRules {
  denyList?: IPRestrictionRule[];
  allowList?: IPRestrictionRule[];
}

function blockError(): Response {
  return new Response("Forbidden", {
    status: 403,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

/**
 * Retrieves connection information from the Fresh context.
 *
 * @param ctx - The Fresh context object.
 * @param distinctRemoteAddr - Function to determine the address type.
 * @returns The connection information.
 * @throws {TypeError} If the transport protocol is not TCP.
 */
export function getIP(
  ctx: FreshContext,
  distinctRemoteAddr: (addr: string) => AddressType | undefined,
): ConnInfo | never {
  const remoteAddr = ctx.info.remoteAddr;

  if (remoteAddr.transport !== "tcp") {
    throw new TypeError(
      "Unsupported transport protocol. Only TCP is supported.",
    );
  }

  return {
    remote: {
      transport: remoteAddr.transport,
      port: remoteAddr.port,
      address: remoteAddr.hostname,
      addressType: distinctRemoteAddr(remoteAddr.hostname),
    },
  };
}

/**
 * IP restriction middleware for Fresh.
 *
 * @param getIP - Function to extract connection info from the context.
 * @param rules - IP restriction rules (allow/deny lists).
 * @param onError - Optional error handler for denied requests.
 * @returns Middleware function for IP restriction.
 */
export function ipRestriction<T>(
  getIP: (
    ctx: FreshContext,
    distinctRemoteAddr: (addr: string) => AddressType | undefined,
  ) => ConnInfo | never,
  { denyList = [], allowList = [] }: IPRestrictionRules,
  onError?: (
    remote: { addr: string; type: AddressType },
    ctx: FreshContext,
  ) => Response | Promise<Response>,
): MiddlewareFn<T> {
  const allowLength = allowList.length;

  const denyMatcher = buildMatcher(denyList);
  const allowMatcher = buildMatcher(allowList);

  return async function ipRestriction(ctx: FreshContext) {
    const connInfo = getIP(ctx, distinctRemoteAddr);
    const addr = connInfo.remote.address;
    if (!addr) {
      return blockError();
    }
    const type = connInfo.remote.addressType;
    if (!type) {
      return blockError();
    }

    const remoteData = { addr, type, isIPv4: type === "IPv4" };

    if (denyMatcher(remoteData)) {
      if (onError) {
        return onError({ addr, type }, ctx);
      }
      return blockError();
    }
    if (allowMatcher(remoteData)) {
      const res = await ctx.next();
      return res;
    }

    if (allowLength === 0) {
      return await ctx.next();
    } else {
      if (onError) {
        return await onError({ addr, type }, ctx);
      }
      return blockError();
    }
  };
}
