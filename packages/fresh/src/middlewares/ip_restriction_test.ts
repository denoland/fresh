import { App } from "../app.ts";
import type { Context } from "../context.ts";
import {
  ipRestriction,
  type IpRestrictionOptions,
  type IPRestrictionRules,
} from "./ip_restriction.ts";
import { expect } from "@std/expect";

function testHandler<T>(
  remortAddr: string,
  ipRestrictionRules: IPRestrictionRules,
  options?: IpRestrictionOptions,
): (request: Request) => Promise<Response> {
  function remoteHostOverRide(ctx: Context<T>) {
    (ctx.info.remoteAddr as { hostname: string }).hostname = remortAddr;
    return ctx.next();
  }

  if (!options) {
    return new App<T>()
      .use(remoteHostOverRide)
      .use(ipRestriction(ipRestrictionRules))
      .all("/", () => new Response("hello"))
      .handler();
  }

  return new App<T>()
    .use(remoteHostOverRide)
    .use(ipRestriction(ipRestrictionRules, options))
    .all("/", () => new Response("hello"))
    .handler();
}

async function createTest(
  addr: string,
  ipRestrictionRules: IPRestrictionRules,
  options?: IpRestrictionOptions,
): Promise<number> {
  const handler = testHandler(addr, ipRestrictionRules, options);

  const res = await handler(new Request("https://localhost/"));

  return res.status;
}

Deno.test("ipRestriction - no option", async () => {
  expect(await createTest("192.168.1.10", {})).toBe(200);
});
Deno.test("ipRestriction - set ipRestrictionRules deny only", async () => {
  const ipRestrictionRules = {
    denyList: ["192.168.1.10", "2001:db8::1"],
  };

  expect(await createTest("192.168.1.10", ipRestrictionRules)).toBe(403);
  expect(await createTest("192.168.1.11", ipRestrictionRules)).toBe(200);
  expect(await createTest("2001:db8::1", ipRestrictionRules)).toBe(403);
  expect(await createTest("2001:db8::2", ipRestrictionRules)).toBe(200);
});

Deno.test("ipRestriction - set ipRestrictionRules arrow only", async () => {
  const ipRestrictionRules = {
    allowList: ["192.168.1.10", "2001:db8::1"],
  };
  expect(await createTest("192.168.1.10", ipRestrictionRules)).toBe(200);
  expect(await createTest("192.168.1.11", ipRestrictionRules)).toBe(403);
  expect(await createTest("2001:db8::1", ipRestrictionRules)).toBe(200);
  expect(await createTest("2001:db8::2", ipRestrictionRules)).toBe(403);
});

// arrow and deny
// deny の方が優先されるを英語で
// When both allow and deny are set, deny takes precedence
Deno.test("ipRestriction - set ipRestrictionRules arrow and deny", async () => {
  const ipRestrictionRules = {
    denyList: ["192.168.1.10", "2001:db8::1"],
    allowList: ["192.168.1.10", "2001:db8::1"],
  };
  expect(await createTest("192.168.1.10", ipRestrictionRules)).toBe(403);
  expect(await createTest("2001:db8::1", ipRestrictionRules)).toBe(403);
});

// adapt subnet mask
Deno.test("ipRestriction - adapt subnet mask", async () => {
  const ipRestrictionRules = {
    denyList: ["192.168.1.0/24"],
  };
  expect(await createTest("192.168.1.10", ipRestrictionRules)).toBe(403);
});

// onError
Deno.test("ipRestriction - custom onError", async () => {
  const ipRestrictionRules = {
    denyList: ["192.168.1.0/24"],
  };

  const customOnError: IpRestrictionOptions = {
    onError: () => {
      return new Response("custom onError", { status: 401 });
    },
  };

  expect(await createTest("192.168.1.10", ipRestrictionRules, customOnError))
    .toBe(401);
});
