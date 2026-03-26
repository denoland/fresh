import { App } from "../app.ts";
import type { Context } from "../context.ts";
import {
  ipFilter,
  type IpFilterOptions,
  type IpFilterRules,
} from "./ip_filter.ts";
import { expect } from "@std/expect";

function testHandler<T>(
  remoteAddr: string,
  ipFilterRules: IpFilterRules,
  options?: IpFilterOptions,
): (request: Request) => Promise<Response> {
  function remoteHostOverride(ctx: Context<T>) {
    (ctx.info.remoteAddr as { hostname: string }).hostname = remoteAddr;
    return ctx.next();
  }

  return new App<T>()
    .use(remoteHostOverride)
    .use(ipFilter(ipFilterRules, options))
    .all("/", () => new Response("hello"))
    .handler();
}

async function createTest(
  addr: string,
  ipFilterRules: IpFilterRules,
  options?: IpFilterOptions,
): Promise<number> {
  const handler = testHandler(addr, ipFilterRules, options);

  const res = await handler(new Request("https://localhost/"));

  return res.status;
}

Deno.test("ipFilter - no option", async () => {
  expect(await createTest("192.168.1.10", {})).toBe(200);
});
Deno.test("ipFilter - deny only", async () => {
  const ipFilterRules = {
    denyList: ["192.168.1.10", "2001:db8::1"],
  };

  expect(await createTest("192.168.1.10", ipFilterRules)).toBe(403);
  expect(await createTest("192.168.1.11", ipFilterRules)).toBe(200);
  expect(await createTest("2001:db8::1", ipFilterRules)).toBe(403);
  expect(await createTest("2001:db8::2", ipFilterRules)).toBe(200);
});

Deno.test("ipFilter - allow only", async () => {
  const ipFilterRules = {
    allowList: ["192.168.1.10", "2001:db8::1"],
  };
  expect(await createTest("192.168.1.10", ipFilterRules)).toBe(200);
  expect(await createTest("192.168.1.11", ipFilterRules)).toBe(403);
  expect(await createTest("2001:db8::1", ipFilterRules)).toBe(200);
  expect(await createTest("2001:db8::2", ipFilterRules)).toBe(403);
});

// When both allow and deny are set, deny takes precedence
Deno.test("ipFilter - allow and deny", async () => {
  const ipFilterRules = {
    denyList: ["192.168.1.10", "2001:db8::1"],
    allowList: ["192.168.1.10", "2001:db8::1"],
  };
  expect(await createTest("192.168.1.10", ipFilterRules)).toBe(403);
  expect(await createTest("2001:db8::1", ipFilterRules)).toBe(403);
});

Deno.test("ipFilter - subnet mask", async () => {
  const ipFilterRules = {
    denyList: ["192.168.1.0/24"],
  };
  expect(await createTest("192.168.1.10", ipFilterRules)).toBe(403);
});

Deno.test("ipFilter - custom onBlocked", async () => {
  const ipFilterRules = {
    denyList: ["192.168.1.0/24"],
  };

  const options: IpFilterOptions = {
    onBlocked: () => {
      return new Response("custom blocked", { status: 401 });
    },
  };

  expect(await createTest("192.168.1.10", ipFilterRules, options))
    .toBe(401);
});
