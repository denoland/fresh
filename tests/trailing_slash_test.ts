import { INTERNAL_PREFIX } from "../runtime.ts";
import { ServerContext, STATUS_CODE } from "../server.ts";
import { assert, assertEquals } from "./deps.ts";
import manifest from "./fixture_router/fresh.gen.ts";

const ctx = await ServerContext.fromManifest(manifest, {
  router: {
    trailingSlash: true,
  },
});
const router = (req: Request) => {
  return ctx.handler()(req, {
    remoteAddr: {
      transport: "tcp",
      hostname: "127.0.0.1",
      port: 80,
    },
    // deno-lint-ignore no-explicit-any
  } as any);
};

Deno.test("forwards slash placed at the end of url", async () => {
  const targetUrl = "https://fresh.deno.dev/about";
  const resp = await router(new Request(targetUrl));
  assert(resp);
  assertEquals(resp.status, STATUS_CODE.PermanentRedirect);
  // forwarded location should be with trailing slash
  assertEquals(resp.headers.get("location"), targetUrl + "/");
});

Deno.test("forwards slash placed at the end of url with hash and query string", async () => {
  const targetUrl = "https://fresh.deno.dev/about";
  const queryAndHash = "?demo=test#what";
  const resp = await router(new Request(targetUrl + queryAndHash));
  assert(resp);
  assertEquals(resp.status, STATUS_CODE.PermanentRedirect);
  // forwarded location should be with trailing slash
  assertEquals(resp.headers.get("location"), targetUrl + "/" + queryAndHash);
});

Deno.test("forwards slash not placed at the end of url with prefix", async () => {
  const targetUrl = `https://fresh.deno.dev${INTERNAL_PREFIX}/no_redirect`;
  const resp = await router(new Request(targetUrl));
  assert(resp);
  // we should get a 404 and not a redirect
  assertEquals(resp.status, STATUS_CODE.NotFound);
});

Deno.test("forwards slash not placed at the end of url for static file", async () => {
  const targetUrl = `https://fresh.deno.dev/foo.txt`;
  const resp = await router(new Request(targetUrl));
  assert(resp);
  // we should not be getting a redirect
  assertEquals(resp.status, STATUS_CODE.OK);
  assertEquals(await resp.text(), "bar");
});
