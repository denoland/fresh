import { expect } from "@std/expect/expect";
import { App } from "../app.ts";
import { csp } from "./csp.ts";

Deno.test("CSP - GET default", async () => {
  const handler = new App()
    .use(csp())
    .get("/", () => new Response("ok"))
    .handler();
  const res = await handler(new Request("https://localhost/"));
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Security-Policy")).toBeDefined();
  expect(res.headers.get("Content-Security-Policy")).toContain(
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; media-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  );
});

Deno.test("CSP - GET with override options", async () => {
  const handler = new App()
    .use(csp({
      reportTo: "/api/csp-reports",
      csp: [
        "font-src 'self' 'https://fonts.gstatic.com'",
        "style-src 'self' 'https://fonts.googleapis.com'",
      ],
    }))
    .get("/", () => new Response("ok"))
    .handler();

  const res = await handler(new Request("https://localhost/"));
  const header = res.headers.get("Content-Security-Policy")!;

  expect(res.status).toBe(200);
  expect(header).toContain(
    "font-src 'self' 'https://fonts.gstatic.com'",
  );
  expect(header).toContain(
    "style-src 'self' 'https://fonts.googleapis.com'",
  );
  expect(header).toContain("report-uri /api/csp-reports");
  expect(res.headers.get("Reporting-Endpoints")).toBe(
    'csp-endpoint="/api/csp-reports"',
  );

  // Overrides should replace defaults, not duplicate them
  const fontSrcCount = header.split("font-src").length - 1;
  expect(fontSrcCount).toBe(1);
  const styleSrcCount = header.split("style-src").length - 1;
  expect(styleSrcCount).toBe(1);
});

Deno.test("CSP - user directives override defaults", async () => {
  const handler = new App()
    .use(csp({
      csp: [
        "img-src 'self' https://example.com data:",
      ],
    }))
    .get("/", () => new Response("ok"))
    .handler();

  const res = await handler(new Request("https://localhost/"));
  const header = res.headers.get("Content-Security-Policy")!;

  // Should contain the user's img-src, not the default
  expect(header).toContain("img-src 'self' https://example.com data:");

  // Should not duplicate img-src
  const imgSrcCount = header.split("img-src").length - 1;
  expect(imgSrcCount).toBe(1);
});

Deno.test("CSP - GET report only", async () => {
  const handler = new App()
    .use(csp({
      reportOnly: true,
    }))
    .get("/", () => new Response("ok"))
    .handler();

  const res = await handler(new Request("https://localhost/"));
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Security-Policy-Report-Only")).toBeDefined();
  expect(res.headers.get("Content-Security-Policy-Report-Only")).toContain(
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; media-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  );
});
