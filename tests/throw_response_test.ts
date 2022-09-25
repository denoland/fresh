import { ServerContext, Status } from "../server.ts";
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "./deps.ts";
import manifest from "./fixture_throw_response/fresh.gen.ts";

const ctx = await ServerContext.fromManifest(manifest, {});
const handler = ctx.handler();
const router = (req: Request) => {
  return handler(req, {
    localAddr: {
      transport: "tcp",
      hostname: "127.0.0.1",
      port: 80,
    },
    remoteAddr: {
      transport: "tcp",
      hostname: "127.0.0.1",
      port: 80,
    },
  });
};

Deno.test("server renders responses thrown while rendering pages", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/"));
  assert(resp);
  assertEquals(resp.status, Status.OK);
  const body = await resp.text();
  assertStringIncludes(body, `Intercepted`);
  assert(!body.includes('Not Intercepted'))
});

Deno.test("server renders responses thrown in handlers", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/nested"));
  assert(resp);
  assertEquals(resp.status, Status.OK);
  const body = await resp.text();
  assertStringIncludes(body, `Intercepted`);
  assert(!body.includes('Not Intercepted'))
});