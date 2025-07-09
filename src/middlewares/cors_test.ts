import { App } from "../app.ts";
import { cors } from "./cors.ts";
import { expect } from "@std/expect";

Deno.test("CORS - GET default", async () => {
  const handler = new App()
    .use(cors())
    .get("/", () => new Response("ok"))
    .handler();

  const res = await handler(new Request("https://localhost/"));

  expect(res.status).toBe(200);
  expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  expect(res.headers.get("Vary")).toBeNull();
});

Deno.test("CORS - Preflight default", async () => {
  const handler = new App()
    .use(cors())
    .get("/", () => new Response("ok"))
    .handler();

  const req = new Request("https://localhost/", { method: "OPTIONS" });
  req.headers.append(
    "Access-Control-Request-Headers",
    "X-PINGOTHER, Content-Type",
  );

  const res = await handler(req);

  expect(res.status).toBe(204);
  expect(res.statusText).toBe("No Content");
  expect(res.headers.get("Access-Control-Allow-Methods")?.split(",")[0]).toBe(
    "GET",
  );
  expect(res.headers.get("Access-Control-Allow-Headers")?.split(",")).toEqual(
    [
      "X-PINGOTHER",
      "Content-Type",
    ],
  );
});

Deno.test("CORS - Preflight with options", async () => {
  const handler = new App()
    .use(
      cors({
        origin: "http://example.com",
        allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests"],
        allowMethods: ["POST", "GET", "OPTIONS"],
        exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
        maxAge: 600,
        credentials: true,
      }),
    )
    .get("/", () => new Response("ok"))
    .handler();

  const res = await handler(
    new Request("https://localhost/", {
      method: "OPTIONS",
      headers: { origin: "http://example.com" },
    }),
  );

  expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
    "http://example.com",
  );
  expect(res.headers.get("Vary")?.split(/\s*,\s*/)).toEqual(
    expect.arrayContaining(["Origin"]),
  );
  expect(res.headers.get("Access-Control-Allow-Headers")?.split(/\s*,\s*/))
    .toEqual([
      "X-Custom-Header",
      "Upgrade-Insecure-Requests",
    ]);
  expect(res.headers.get("Access-Control-Allow-Methods")?.split(/\s*,\s*/))
    .toEqual([
      "POST",
      "GET",
      "OPTIONS",
    ]);
  expect(res.headers.get("Access-Control-Expose-Headers")?.split(/\s*,\s*/))
    .toEqual([
      "Content-Length",
      "X-Kuma-Revision",
    ]);
  expect(res.headers.get("Access-Control-Max-Age")).toBe("600");
  expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
});

Deno.test("CORS - Disallow an unmatched origin", async () => {
  const handler = new App()
    .use(
      cors({
        origin: "http://example.com",
        allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests"],
        allowMethods: ["POST", "GET", "OPTIONS"],
        exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
        maxAge: 600,
        credentials: true,
      }),
    )
    .get("/", () => new Response("ok"))
    .handler();

  const res = await handler(
    new Request("https://localhost/", {
      method: "OPTIONS",
      headers: { origin: "http://example.net" },
    }),
  );

  expect(res.headers.has("Access-Control-Allow-Origin")).toBeFalsy();
});

Deno.test("CORS - Allow multiple origins", async () => {
  const handler = new App()
    .use(cors({
      origin: [
        "http://example.com",
        "http://example.org",
        "http://example.dev",
      ],
    }))
    .get("/", () => new Response("ok"))
    .handler();

  let res = await handler(
    new Request("http://localhost/", {
      headers: {
        Origin: "http://example.org",
      },
    }),
  );
  expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
    "http://example.org",
  );

  res = await handler(new Request("http://localhost/"));
  expect(
    res.headers.has("Access-Control-Allow-Origin"),
    "An unmatched origin should be disallowed",
  ).toBeFalsy();

  res = await handler(
    new Request("http://localhost/api3/abc", {
      headers: {
        Referer: "http://example.net/",
      },
    }),
  );
  expect(
    res.headers.has("Access-Control-Allow-Origin"),
    "An unmatched origin should be disallowed",
  ).toBeFalsy();
});

Deno.test("CORS - Allow different Vary header value", async () => {
  const handler = new App()
    .use(cors({
      origin: [
        "http://example.com",
        "http://example.org",
        "http://example.dev",
      ],
    }))
    .get("/", () => new Response("ok"))
    .handler();

  const res = await handler(
    new Request("http://localhost/", {
      headers: {
        Vary: "accept-encoding",
        Origin: "http://example.com",
      },
    }),
  );

  expect(res.status).toBe(200);
  expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
    "http://example.com",
  );
  expect(res.headers.get("Vary")).toBe("Origin");
});

Deno.test("CORS - Allow origins by function", async () => {
  const handler = new App()
    .use(cors({
      origin: (
        origin,
      ) => (origin.endsWith(".example.com") ? origin : "http://example.com"),
    }))
    .get("/", () => new Response("ok"))
    .handler();

  let res = await handler(
    new Request("http://localhost/", {
      headers: {
        Origin: "http://subdomain.example.com",
      },
    }),
  );
  expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
    "http://subdomain.example.com",
  );

  res = await handler(new Request("http://localhost/"));
  expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
    "http://example.com",
  );

  res = await handler(
    new Request("http://localhost/", {
      headers: {
        Referer: "http://evil-example.com/",
      },
    }),
  );
  expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
    "http://example.com",
  );
});

Deno.test("CORS - With raw Response object", async () => {
  const handler = new App()
    .use(cors())
    .get("/", () => new Response("ok"))
    .handler();

  const res = await handler(new Request("http://localhost/"));

  expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  expect(res.headers.get("Vary")).toBeNull();
});

Deno.test("CORS - Should not return duplicate header values", async () => {
  const handler = new App()
    .use(cors({ origin: "http://example.com" }))
    .get("/", () => new Response("ok"))
    .handler();

  const res = await handler(
    new Request("http://localhost/", {
      headers: {
        origin: "http://example.com",
      },
    }),
  );

  expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
    "http://example.com",
  );
});
