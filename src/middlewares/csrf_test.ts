import { App } from "../app.ts";
import type { Method } from "../router.ts";
import { csrf, type CsrfOptions } from "./csrf.ts";
import { expect } from "@std/expect";

function testHandler<T>(
  options?: CsrfOptions<T>,
): (request: Request) => Promise<Response> {
  return new App<T>()
    .use(csrf(options))
    .all("/", () => new Response("hello"))
    .handler();
}

function createTests(trusted: CsrfOptions["origin"]) {
  return async function runTest(
    method: Method,
    expected: 200 | 403,
    test: {
      secFetchSite?: "cross-site" | "same-origin" | "same-site" | "none";
      origin?: string;
    } = {},
  ) {
    const handler = testHandler({ origin: trusted });

    const headers = new Headers();
    if (test.secFetchSite) headers.append("Sec-Fetch-Site", test.secFetchSite);
    if (test.origin) {
      headers.append("Origin", test.origin);
    }

    const res = await handler(
      new Request("https://example.com", { method, headers }),
    );
    await res.body?.cancel();
    expect(res.status).toEqual(expected);
  };
}

Deno.test("CSRF - allow GET/HEAD/OPTIONS", async () => {
  const runTest = createTests("https://example.com");

  await runTest("GET", 200);
  await runTest("HEAD", 200);
  await runTest("OPTIONS", 200);
});

Deno.test("CSRF - Sec-Fetch-Site", async () => {
  const runTest = createTests("https://example.com");

  await runTest("POST", 200, { secFetchSite: "same-origin" });
  await runTest("POST", 200, { secFetchSite: "none" });
  await runTest("POST", 403, { secFetchSite: "cross-site" });
  await runTest("POST", 403, { secFetchSite: "same-site" });

  await runTest("POST", 200);
  await runTest("POST", 200, { origin: "https://example.com" });
  await runTest("POST", 403, { origin: "https://attacker.example.com" });
  await runTest("POST", 403, { origin: "null" });

  await runTest("GET", 200, { secFetchSite: "cross-site" });
  await runTest("HEAD", 200, { secFetchSite: "cross-site" });
  await runTest("OPTIONS", 200, { secFetchSite: "cross-site" });
  await runTest("PUT", 403, { secFetchSite: "cross-site" });
});

Deno.test("CSRF - cross origin", async () => {
  const runTest = createTests("https://trusted.example.com");

  await runTest("POST", 200, { origin: "https://trusted.example.com" });
  await runTest("POST", 200, {
    origin: "https://trusted.example.com",
    secFetchSite: "cross-site",
  });

  await runTest("POST", 403, { origin: "https://attacker.example.com" });
  await runTest("POST", 403, {
    origin: "https://attacker.example.com",
    secFetchSite: "cross-site",
  });
});

Deno.test("CSRF - array origin", async () => {
  const runTest = createTests(
    ["https://example.com", "https://trusted.example.com"],
  );

  await runTest("POST", 200, { origin: "https://trusted.example.com" });
  await runTest("POST", 200, { origin: "https://example.com" });
  await runTest("POST", 403, { origin: "https://foo.example.com" });
});

Deno.test("CSRF - function origin", async () => {
  const runTest = createTests(
    (origin) => origin === "https://example.com",
  );

  await runTest("POST", 200, { origin: "https://example.com" });
  await runTest("POST", 403, { origin: "https://trusted.example.com" });
  await runTest("POST", 403, { origin: "https://foo.example.com" });
});
