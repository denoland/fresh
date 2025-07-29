import { staticFiles } from "./static_files.ts";
import { serveMiddleware } from "../test_utils.ts";
import type { BuildCache, StaticFile } from "../build_cache.ts";
import { expect } from "@std/expect";
import { ASSET_CACHE_BUST_KEY } from "../runtime/shared_internal.tsx";
import { BUILD_ID } from "../runtime/build_id.ts";
import type { Command } from "../commands.ts";
import type { ServerIslandRegistry } from "../context.ts";

class MockBuildCache implements BuildCache {
  root = "";
  buildId = "MockId";
  files = new Map<string, StaticFile>();
  islandRegistry: ServerIslandRegistry = new Map();

  constructor(files: Record<string, { hash: string | null; content: string }>) {
    const encoder = new TextEncoder();
    for (const [pathname, info] of Object.entries(files)) {
      const text = encoder.encode(info.content);

      const normalized = pathname.startsWith("/") ? pathname : "/" + pathname;
      this.files.set(normalized, {
        hash: info.hash,
        size: text.byteLength,
        readable: text,
        close: () => {},
      });
    }
  }

  // deno-lint-ignore no-explicit-any
  getFsRoutes(): Command<any>[] {
    return [];
  }

  // deno-lint-ignore require-await
  async readFile(pathname: string): Promise<StaticFile | null> {
    return this.files.get(pathname) ?? null;
  }
}

Deno.test("static files - 200", async () => {
  const buildCache = new MockBuildCache({
    "foo.css": { content: "body {}", hash: null },
  });
  const server = serveMiddleware(
    staticFiles(),
    { buildCache },
  );

  const res = await server.get("/foo.css");
  const content = await res.text();
  expect(res.status).toEqual(200);
  expect(res.headers.get("Content-Type")).toEqual("text/css; charset=UTF-8");
  expect(res.headers.get("Content-Length")).toEqual("7");
  expect(res.headers.get("Cache-Control")).toEqual(
    "no-cache, no-store, max-age=0, must-revalidate",
  );
  expect(content).toEqual("body {}");
});

Deno.test("static files - HEAD 200", async () => {
  const buildCache = new MockBuildCache({
    "foo.css": { content: "body {}", hash: null },
  });
  const server = serveMiddleware(
    staticFiles(),
    { buildCache },
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
    staticFiles(),
    { buildCache },
  );

  const cacheUrl = `/foo.css?${ASSET_CACHE_BUST_KEY}=${BUILD_ID}`;
  let res = await server.get(cacheUrl);
  await res.body?.cancel();
  expect(res.headers.get("Etag")).toEqual('W/"123"');

  let headers = new Headers();
  headers.append("If-None-Match", "123");
  res = await server.get(cacheUrl, { headers });
  await res.body?.cancel();
  expect(res.status).toEqual(304);

  headers = new Headers();
  headers.append("If-None-Match", 'W/"123"');
  res = await server.get(cacheUrl, { headers });
  await res.body?.cancel();
  expect(res.status).toEqual(304);
});

Deno.test("static files - 404 on missing favicon.ico", async () => {
  const buildCache = new MockBuildCache({});
  const server = serveMiddleware(
    staticFiles(),
    { buildCache },
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
    staticFiles(),
    { buildCache },
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
    staticFiles(),
    {
      buildCache,
      config: {
        root: "",
        basePath: "",
        mode: "development",
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

Deno.test("static files - enables caching in production", async () => {
  const buildCache = new MockBuildCache({
    "foo.css": { content: "body {}", hash: null },
  });
  const server = serveMiddleware(
    staticFiles(),
    {
      buildCache,
      config: {
        root: "",
        basePath: "",
        mode: "production",
      },
    },
  );

  const res = await server.get(`/foo.css?${ASSET_CACHE_BUST_KEY}=${BUILD_ID}`);
  await res.body?.cancel();
  expect(res.status).toEqual(200);
  expect(res.headers.get("Cache-Control")).toEqual(
    "public, max-age=31536000, immutable",
  );
});

Deno.test("static files - decoded pathname", async () => {
  const buildCache = new MockBuildCache({
    "C#.svg": { content: "body {}", hash: null },
    "西安市.png": { content: "body {}", hash: null },
    "인천.avif": { content: "body {}", hash: null },
  });
  const server = serveMiddleware(
    staticFiles(),
    { buildCache },
  );

  for (
    const path of [
      "C%23.svg",
      "%E8%A5%BF%E5%AE%89%E5%B8%82.png",
      "%EC%9D%B8%EC%B2%9C.avif",
    ]
  ) {
    const res = await server.get("/" + path);
    await res.body?.cancel();
    expect(res.status).toEqual(200);
  }
});

Deno.test("static files - fallthrough", async () => {
  const buildCache = new MockBuildCache({
    "foo.css": { content: "body {}", hash: null },
  });

  const server = serveMiddleware(
    staticFiles(),
    { buildCache, next: () => Promise.resolve(new Response("it works")) },
  );

  let res = await server.get("foo.css");
  let text = await res.text();
  expect(text).toEqual("body {}");

  res = await server.get("/");
  text = await res.text();
  expect(text).toEqual("it works");
});
