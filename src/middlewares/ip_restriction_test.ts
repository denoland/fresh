import { App } from "../app.ts";
import type { FreshContext } from "../context.ts";
import {
  type AddressType,
  type ConnInfo,
  convertIPv4BinaryToString,
  convertIPv4ToBinary,
  convertIPv6BinaryToString,
  convertIPv6ToBinary,
  distinctRemoteAddr,
  expandIPv6,
  ipRestriction,
  type IPRestrictionRule,
} from "./ip-restriction.ts";

import { beforeEach, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";

describe("expandIPv6", () => {
  it("Should result be valid", () => {
    expect(expandIPv6("1::1")).toBe("0001:0000:0000:0000:0000:0000:0000:0001");
    expect(expandIPv6("::1")).toBe("0000:0000:0000:0000:0000:0000:0000:0001");
    expect(expandIPv6("2001:2::")).toBe(
      "2001:0002:0000:0000:0000:0000:0000:0000",
    );
    expect(expandIPv6("2001:2::")).toBe(
      "2001:0002:0000:0000:0000:0000:0000:0000",
    );
    expect(expandIPv6("2001:0:0:db8::1")).toBe(
      "2001:0000:0000:0db8:0000:0000:0000:0001",
    );
    expect(expandIPv6("::ffff:127.0.0.1")).toBe(
      "0000:0000:0000:0000:0000:ffff:7f00:0001",
    );
  });
});
describe("distinctRemoteAddr", () => {
  it("Should result be valid", () => {
    expect(distinctRemoteAddr("1::1")).toBe("IPv6");
    expect(distinctRemoteAddr("::1")).toBe("IPv6");
    expect(distinctRemoteAddr("::ffff:127.0.0.1")).toBe("IPv6");

    expect(distinctRemoteAddr("192.168.2.0")).toBe("IPv4");
    expect(distinctRemoteAddr("192.168.2.0")).toBe("IPv4");

    expect(distinctRemoteAddr("example.com")).toBeUndefined();
  });
});

describe("convertIPv4ToBinary", () => {
  it("Should result is valid", () => {
    expect(convertIPv4ToBinary("0.0.0.0")).toBe(0n);
    expect(convertIPv4ToBinary("0.0.0.1")).toBe(1n);

    expect(convertIPv4ToBinary("0.0.1.0")).toBe(1n << 8n);
  });
});

describe("convertIPv4ToString", () => {
  expect(convertIPv4BinaryToString(convertIPv4ToBinary("0.0.0.0"))).toBe(
    "0.0.0.0",
  );
  expect(convertIPv4BinaryToString(convertIPv4ToBinary("0.0.0.1"))).toBe(
    "0.0.0.1",
  );
  expect(convertIPv4BinaryToString(convertIPv4ToBinary("0.0.1.0"))).toBe(
    "0.0.1.0",
  );
});

describe("convertIPv6ToBinary", () => {
  it("Should result is valid", () => {
    expect(convertIPv6ToBinary("::0")).toBe(0n);
    expect(convertIPv6ToBinary("::1")).toBe(1n);

    expect(convertIPv6ToBinary("::f")).toBe(15n);
    expect(convertIPv6ToBinary("1234:::5678")).toBe(
      24196103360772296748952112894165669496n,
    );
    expect(convertIPv6ToBinary("::ffff:127.0.0.1")).toBe(281472812449793n);
  });
});

describe("convertIPv6ToString", () => {
  expect(convertIPv6BinaryToString(convertIPv6ToBinary("::1"))).toBe("::1");
  expect(convertIPv6BinaryToString(convertIPv6ToBinary("1::"))).toBe("1::");
  expect(convertIPv6BinaryToString(convertIPv6ToBinary("1234:::5678"))).toBe(
    "1234::5678",
  );
  expect(convertIPv6BinaryToString(convertIPv6ToBinary("2001:2::"))).toBe(
    "2001:2::",
  );
  expect(convertIPv6BinaryToString(convertIPv6ToBinary("2001::db8:0:0:0:0:1")))
    .toBe("2001:0:db8::1");
  expect(
    convertIPv6BinaryToString(
      convertIPv6ToBinary("1234:5678:9abc:def0:1234:5678:9abc:def0"),
    ),
  ).toBe("1234:5678:9abc:def0:1234:5678:9abc:def0");
  expect(convertIPv6BinaryToString(convertIPv6ToBinary("::ffff:127.0.0.1")))
    .toBe("::ffff:127.0.0.1");
});

describe("ipRestriction middleware", () => {
  const app = new App();

  let hostname = "hogehoge";

  function setDummyHostName(source: string): void {
    hostname = source;
  }

  function dummyGetIp(
    _ctx: FreshContext,
    distinctRemoteAddr: (addr: string) => AddressType | undefined,
  ): ConnInfo | never {
    return {
      remote: {
        transport: "tcp",
        port: 12345,
        address: hostname,
        addressType: distinctRemoteAddr(hostname),
      },
    };
  }

  app.all(
    "/basic/*",
    ipRestriction(
      dummyGetIp,
      {
        allowList: ["192.168.1.0", "192.168.2.0/24"],
        denyList: ["192.168.2.10"],
      },
    ),
  );
  app.get("/basic/", () => {
    return new Response("Hello World!");
  });

  app.all(
    "/allow-empty/*",
    ipRestriction(dummyGetIp, {
      denyList: ["192.168.1.0"],
    }),
  );
  app.get("/allow-empty/", () => new Response("Hello World!"));

  const handler = app.handler();

  beforeEach(() => {
    setDummyHostName("hoge");
  });
  it("GET /basic with! 0.0.0.0", async () => {
    setDummyHostName("0.0.0.0");
    const res = await handler(new Request("http://localhost/basic/"));
    expect(res.status).toBe(403);
  });
  it("GET /basic with! 192.168.1.0", async () => {
    setDummyHostName("192.168.1.0");
    const res = await handler(new Request("http://localhost/basic/"));
    expect(res.status).toBe(200);
  });

  it("GET /basic with! 192.168.2.5", async () => {
    setDummyHostName("192.168.2.5");
    const res = await handler(new Request("http://localhost/basic/"));
    expect(res.status).toBe(200);
  });
  it("GET /basic with! 192.168.2.10", async () => {
    setDummyHostName("192.168.2.10");
    const res = await handler(new Request("http://localhost/basic/"));
    expect(res.status).toBe(403);
  });
  it("GET /basic with! 0.0.0.0", async () => {
    setDummyHostName("0.0.0.0");
    const res = await handler(new Request("http://localhost/allow-empty/"));
    expect(res.status).toBe(200);
  });
  it("GET /basic with! 192.168.1.0", async () => {
    setDummyHostName("192.168.1.0");
    const res = await handler(new Request("http://localhost/allow-empty/"));
    expect(res.status).toBe(403);
  });
  it("GET /basic with! 192.168.2.5", async () => {
    setDummyHostName("192.168.2.5");
    const res = await handler(new Request("http://localhost/allow-empty/"));
    expect(res.status).toBe(200);
  });
  it("GET /basic with! 192.168.2.10", async () => {
    setDummyHostName("192.168.2.10");
    const res = await handler(new Request("http://localhost/allow-empty/"));
    expect(res.status).toBe(200);
  });
});

describe("isMatchForRule", () => {
  const app = new App();

  const hostname = "0.0.0.0";

  function dummyGetIp(
    _ctx: FreshContext,
    distinctRemoteAddr: (addr: string) => AddressType | undefined,
  ): ConnInfo | never {
    return {
      remote: {
        transport: "tcp",
        port: 12345,
        address: hostname,
        addressType: distinctRemoteAddr(hostname),
      },
    };
  }

  app.all(
    "*",
    ipRestriction(
      dummyGetIp,
      {
        denyList: ["0.0.0.0"],
      },
      () => new Response("error"),
    ),
  );
  app.get("*", () => new Response("ok"));

  const handler = app.handler();

  it("Custom onerror", async () => {
    const res = await handler(new Request("http://localhost/"));
    expect(res).toBeTruthy();
    expect(await res.text()).toBe("error");
  });
});

describe("isMatchForRule", () => {
  const isMatch = async (
    info: { addr: string; type: AddressType },
    rule: IPRestrictionRule,
  ) => {
    const middleware = ipRestriction(
      () => ({
        remote: {
          transport: "tcp",
          port: 12345,
          address: info.addr,
          addressType: info.type,
        },
      }),
      {
        allowList: [rule],
      },
    );
    const mockContext = {
      next: () => Promise.resolve(new Response("hoge")),
    } as unknown as FreshContext;
    const res = await middleware(mockContext);

    return res.status === 200;
  };

  it("star", async () => {
    expect(await isMatch({ addr: "192.168.2.0", type: "IPv4" }, "*"))
      .toBeTruthy();
    expect(await isMatch({ addr: "192.168.2.1", type: "IPv4" }, "*"))
      .toBeTruthy();
    expect(await isMatch({ addr: "::0", type: "IPv6" }, "*")).toBeTruthy();
  });
  it("CIDR Notation", async () => {
    expect(
      await isMatch({ addr: "192.168.2.0", type: "IPv4" }, "192.168.2.0/24"),
    ).toBeTruthy();
    expect(
      await isMatch({ addr: "192.168.2.1", type: "IPv4" }, "192.168.2.0/24"),
    ).toBeTruthy();
    expect(
      await isMatch({ addr: "192.168.2.1", type: "IPv4" }, "192.168.2.1/32"),
    ).toBeTruthy();
    expect(
      await isMatch({ addr: "192.168.2.1", type: "IPv4" }, "192.168.2.2/32"),
    ).toBeFalsy();

    expect(await isMatch({ addr: "::0", type: "IPv6" }, "::0/1")).toBeTruthy();
  });
  it("Static Rules", async () => {
    expect(await isMatch({ addr: "192.168.2.1", type: "IPv4" }, "192.168.2.1"))
      .toBeTruthy();
    expect(await isMatch({ addr: "1234::5678", type: "IPv6" }, "1234::5678"))
      .toBeTruthy();
    expect(
      await isMatch(
        { addr: "::ffff:127.0.0.1", type: "IPv6" },
        "::ffff:127.0.0.1",
      ),
    ).toBeTruthy();
    expect(
      await isMatch(
        { addr: "::ffff:127.0.0.1", type: "IPv6" },
        "::ffff:7f00:1",
      ),
    ).toBeTruthy();
  });
  it("Function Rules", async () => {
    expect(await isMatch({ addr: "0.0.0.0", type: "IPv4" }, () => true))
      .toBeTruthy();
    expect(await isMatch({ addr: "0.0.0.0", type: "IPv4" }, () => false))
      .toBeFalsy();

    const ipaddr = "93.184.216.34";
    await isMatch({ addr: ipaddr, type: "IPv4" }, (ip) => {
      expect(ipaddr).toBe(ip.addr);
      return false;
    });
  });
});
