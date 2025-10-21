import { App } from "../app.ts";
import type { Context } from "../context.ts";
import {
  ipFilter,
  type ipFilterOptions,
  type IpFilterRules,
} from "./ip_filter.ts";
import { expect } from "@std/expect";

function testHandler<T>(
  remortAddr: string,
  ipFilterRules: IpFilterRules,
  options?: ipFilterOptions,
): (request: Request) => Promise<Response> {
  function remoteHostOverRide(ctx: Context<T>) {
    (ctx.info.remoteAddr as { hostname: string }).hostname = remortAddr;
    return ctx.next();
  }

  if (!options) {
    return new App<T>()
      .use(remoteHostOverRide)
      .use(ipFilter(ipFilterRules))
      .all("/", () => new Response("hello"))
      .handler();
  }

  return new App<T>()
    .use(remoteHostOverRide)
    .use(ipFilter(ipFilterRules, options))
    .all("/", () => new Response("hello"))
    .handler();
}

async function createTest(
  addr: string,
  ipFilterRules: IpFilterRules,
  options?: ipFilterOptions,
): Promise<number> {
  const handler = testHandler(addr, ipFilterRules, options);

  const res = await handler(new Request("https://localhost/"));

  return res.status;
}

Deno.test("ipFilter - no option", async () => {
  expect(await createTest("192.168.1.10", {})).toBe(200);
});
Deno.test("ipFilter - set ipFilterRules deny only", async () => {
  const ipFilterRules = {
    denyList: ["192.168.1.10", "2001:db8::1"],
  };

  expect(await createTest("192.168.1.10", ipFilterRules)).toBe(403);
  expect(await createTest("192.168.1.11", ipFilterRules)).toBe(200);
  expect(await createTest("2001:db8::1", ipFilterRules)).toBe(403);
  expect(await createTest("2001:db8::2", ipFilterRules)).toBe(200);
});

Deno.test("ipFilter - set ipFilterRules arrow only", async () => {
  const ipFilterRules = {
    allowList: ["192.168.1.10", "2001:db8::1"],
  };
  expect(await createTest("192.168.1.10", ipFilterRules)).toBe(200);
  expect(await createTest("192.168.1.11", ipFilterRules)).toBe(403);
  expect(await createTest("2001:db8::1", ipFilterRules)).toBe(200);
  expect(await createTest("2001:db8::2", ipFilterRules)).toBe(403);
});

// arrow and deny
// deny の方が優先されるを英語で
// When both allow and deny are set, deny takes precedence
Deno.test("ipFilter - set ipFilterRules arrow and deny", async () => {
  const ipFilterRules = {
    denyList: ["192.168.1.10", "2001:db8::1"],
    allowList: ["192.168.1.10", "2001:db8::1"],
  };
  expect(await createTest("192.168.1.10", ipFilterRules)).toBe(403);
  expect(await createTest("2001:db8::1", ipFilterRules)).toBe(403);
});

// adapt subnet mask
Deno.test("ipFilter - adapt subnet mask", async () => {
  const ipFilterRules = {
    denyList: ["192.168.1.0/24"],
  };
  expect(await createTest("192.168.1.10", ipFilterRules)).toBe(403);
});

// onError
Deno.test("ipFilter - custom onError", async () => {
  const ipFilterRules = {
    denyList: ["192.168.1.0/24"],
  };

  const customOnError: ipFilterOptions = {
    onError: () => {
      return new Response("custom onError", { status: 401 });
    },
  };

  expect(await createTest("192.168.1.10", ipFilterRules, customOnError))
    .toBe(401);
});
