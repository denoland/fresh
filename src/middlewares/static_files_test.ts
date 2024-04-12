import { freshStaticFiles } from "./static_files.ts";
import { serveMiddleware } from "../test_utils.ts";
import type { BuildCache, StaticFile } from "../build_cache.ts";
import { expect } from "@std/expect";

class MockBuildCache implements BuildCache {
  files = new Map<string, StaticFile>();

  constructor(files: Record<string, { hash: string | null; content: string }>) {
    const encoder = new TextEncoder();
    for (const [pathname, info] of Object.entries(files)) {
      const text = encoder.encode(info.content);

      const normalized = pathname.startsWith("/") ? pathname : "/" + pathname;
      this.files.set(normalized, {
        hash: info.hash,
        size: text.byteLength,
        readable: text,
      });
    }
  }

  // deno-lint-ignore require-await
  async readFile(pathname: string): Promise<StaticFile | null> {
    return this.files.get(pathname) ?? null;
  }
  getIslandChunkName(_islandName: string): string | null {
    return null;
  }
}

Deno.test("static files - 200", async () => {
  const buildCache = new MockBuildCache({
    "foo.css": { content: "body {}", hash: null },
  });
  const server = serveMiddleware(
    (ctx) => freshStaticFiles(ctx, buildCache),
  );

  const res = await server.get("/foo.css");
  const content = await res.text();
  expect(res.status).toEqual(200);
  expect(res.headers.get("Content-Type")).toEqual("text/css; charset=UTF-8");
  expect(res.headers.get("Content-Length")).toEqual("7");
  expect(res.headers.get("Cache-Control")).toEqual(null);
  expect(content).toEqual("body {}");
});

Deno.test("static files - HEAD 200", async () => {
  const buildCache = new MockBuildCache({
    "foo.css": { content: "body {}", hash: null },
  });
  const server = serveMiddleware(
    (ctx) => freshStaticFiles(ctx, buildCache),
  );

  const res = await server.head("/foo.css");
  const content = await res.text();
  expect(res.status).toEqual(200);
  expect(res.headers.get("Content-Type")).toEqual("text/css; charset=UTF-8");
  expect(res.headers.get("Content-Length")).toEqual("7");
  expect(content).toEqual("");
});

Deno.test("static files - etag", async () => {
  const buildCache = new MockBuildCache({
    "foo.css": { content: "body {}", hash: "123" },
  });
  const server = serveMiddleware(
    (ctx) => freshStaticFiles(ctx, buildCache),
  );

  const headers = new Headers();
  headers.append("If-None-Match", "123");
  const res = await server.get("/foo.css", { headers });
  await res.body?.cancel();
  expect(res.status).toEqual(304);

  const headers2 = new Headers();
  headers2.append("If-None-Match", "W/123");
  const res2 = await server.get("/foo.css", { headers });
  await res2.body?.cancel();
  expect(res2.status).toEqual(304);
});

Deno.test("static files - 404 on missing favicon.ico", async () => {
  const buildCache = new MockBuildCache({});
  const server = serveMiddleware(
    (ctx) => freshStaticFiles(ctx, buildCache),
  );
  const res = await server.get("favicon.ico");
  await res.body?.cancel();
  expect(res.status).toEqual(404);
});

Deno.test("static files - 405 on wrong HTTP method", async () => {
  const buildCache = new MockBuildCache({
    "foo.css": { content: "body {}", hash: null },
  });
  const server = serveMiddleware(
    (ctx) => freshStaticFiles(ctx, buildCache),
  );

  for (const method of ["post", "patch", "put", "delete"]) {
    // deno-lint-ignore no-explicit-any
    const res = await (server as any)[method]("/foo.css");
    await res.body?.cancel();
    expect(res.status).toEqual(405);
  }
});

Deno.test("static files - disables caching in development", async () => {
  const buildCache = new MockBuildCache({
    "foo.css": { content: "body {}", hash: null },
  });
  const server = serveMiddleware(
    (ctx) => freshStaticFiles(ctx, buildCache),
    {
      config: {
        basePath: "",
        build: {
          outDir: "",
        },
        mode: "development",
        root: ".",
        staticDir: "",
      },
    },
  );

  const res = await server.get("/foo.css");
  await res.body?.cancel();
  expect(res.status).toEqual(200);
  expect(res.headers.get("Cache-Control")).toEqual(
    "no-cache, no-store, max-age=0, must-revalidate",
  );
});
