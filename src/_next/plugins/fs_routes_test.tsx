import { FreshApp } from "$fresh/server.ts";
import { fsRoutes } from "./fs_routes.ts";
import { FakeServer } from "../test_utils.ts";
import * as path from "jsr:@std/path";
import { createFakeFs } from "$fresh/src/_next/test_utils.ts";
import { expect } from "jsr:@std/expect";
import { HandlerFn, HandlerMethod } from "../defines.ts";
import { Method } from "../router.ts";

async function createServer<T>(
  files: Record<string, unknown>,
): Promise<FakeServer> {
  const app = new FreshApp<T>();

  await fsRoutes(app, {
    dir: ".",
    // deno-lint-ignore require-await
    load: async (filePath) => {
      const full = path.join("routes", filePath);
      if (full in files) {
        return files[full];
      }
      throw new Error(`Mock FS: file ${full} not found`);
    },
    _fs: createFakeFs(files),
  });
  return new FakeServer(app.handler());
}

Deno.test("fsRoutes - throws error when file has no exports", async () => {
  const p = createServer({ "routes/index.tsx": {} });
  await expect(p).rejects.toMatch(/relevant exports/);
});

Deno.test("fsRoutes - registers HTTP methods on router", async () => {
  const methodHandler: HandlerMethod<unknown, unknown> = {
    GET: () => new Response("GET"),
    POST: () => new Response("POST"),
    PATCH: () => new Response("PATCH"),
    PUT: () => new Response("PUT"),
    DELETE: () => new Response("DELETE"),
    HEAD: () => new Response("HEAD"),
  };
  const server = await createServer({
    "routes/all.ts": { handlers: methodHandler },
    "routes/get.ts": { handlers: { GET: methodHandler.GET } },
    "routes/post.ts": { handlers: { POST: methodHandler.POST } },
    "routes/patch.ts": { handlers: { PATCH: methodHandler.PATCH } },
    "routes/put.ts": { handlers: { PUT: methodHandler.PUT } },
    "routes/delete.ts": { handlers: { DELETE: methodHandler.DELETE } },
    "routes/head.ts": { handlers: { HEAD: methodHandler.HEAD } },
  });

  const methods: Method[] = ["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD"];
  for (const method of methods) {
    const name = method.toLowerCase() as Lowercase<Method>;
    const res = await server[name]("/all");
    expect(res.status).toEqual(200);
    expect(await res.text()).toEqual(method);
  }

  // Check individual routes
  for (const method of methods) {
    const lower = method.toLowerCase() as Lowercase<Method>;
    const res = await server[lower](`/${lower}`);
    expect(res.status).toEqual(200);
    expect(await res.text()).toEqual(method);

    // Check that all other methods are forbidden
    for (const other of methods) {
      if (other === method) continue;

      const name = other.toLowerCase() as Lowercase<Method>;
      const res = await server[name](`/${lower}`);
      await res.body?.cancel();
      expect(res.status).toEqual(405);
    }
  }
});

Deno.test("fsRoutes - registers fn handler for every method", async () => {
  const handler: HandlerFn<unknown, unknown> = () => new Response("ok");
  const server = await createServer({
    "routes/all.ts": { handlers: handler },
  });

  const methods: Method[] = ["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD"];
  for (const method of methods) {
    const name = method.toLowerCase() as Lowercase<Method>;
    const res = await server[name]("/all");
    expect(res.status).toEqual(200);
    expect(await res.text()).toEqual("ok");
  }

  // Check individual routes
  for (const method of methods) {
    const lower = method.toLowerCase() as Lowercase<Method>;
    const res = await server[lower]("/all");
    expect(res.status).toEqual(200);
    expect(await res.text()).toEqual("ok");
  }
});

Deno.test("fsRoutes - renders component without handler", async () => {
  const server = await createServer({
    "routes/all.ts": { default: () => <h1>foo</h1> },
  });

  const res = await server.get("/all");
  expect(res.status).toEqual(200);
  expect(res.headers.get("Content-Type")).toEqual("text/html; charset=utf-8");
  expect(await res.text()).toEqual("<h1>foo</h1>");
});

Deno.test.ignore("fsRoutes - sorts routes", async () => {
  const server = await createServer({
    "routes/[id].ts": { handler: () => new Response("fail") },
    "routes/all.ts": { handler: () => new Response("ok") },
  });

  const res = await server.get("/all");
  expect(res.status).toEqual(200);
  expect(await res.text()).toEqual("ok");
});
