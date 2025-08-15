import { expect } from "@std/expect";
import { App } from "./app.ts";
import { FakeServer } from "./test_utils.ts";

Deno.test("App - basePath with root index", async () => {
  // This test simulates what happens with a basePath
  // The root index.tsx file pattern becomes "/" which should be accessible at the basePath

  const app = new App({ basePath: "/test" })
    .get("/", () => new Response("Root Index"))
    .get("/subdir", () => new Response("Subdir Index"));

  const server = new FakeServer(app.handler());

  // The root index should be accessible at /test
  const rootRes = await server.get("/test");
  expect(rootRes.status).toBe(200);
  const rootText = await rootRes.text();
  expect(rootText).toBe("Root Index");

  // Subdir should be accessible at /test/subdir
  const subdirRes = await server.get("/test/subdir");
  expect(subdirRes.status).toBe(200);
  const subdirText = await subdirRes.text();
  expect(subdirText).toBe("Subdir Index");

  // Root without basePath should return 404
  const invalidRes = await server.get("/");
  expect(invalidRes.status).toBe(404);
});

Deno.test("App - nested basePath with index routes", async () => {
  // Test deeper nesting like /api/v1
  const app = new App({ basePath: "/api/v1" })
    .get("/", () => new Response("API Root"))
    .get("/users", () => new Response("Users"))
    .get("/users/", () => new Response("Users Index"));

  const server = new FakeServer(app.handler());

  // API root should be accessible
  const rootRes = await server.get("/api/v1");
  expect(rootRes.status).toBe(200);
  expect(await rootRes.text()).toBe("API Root");

  // Users route
  const usersRes = await server.get("/api/v1/users");
  expect(usersRes.status).toBe(200);
  expect(await usersRes.text()).toBe("Users");

  // Users index route (with trailing slash)
  const usersIndexRes = await server.get("/api/v1/users/");
  expect(usersIndexRes.status).toBe(200);
  expect(await usersIndexRes.text()).toBe("Users Index");
});
