import { ServerContext, Status } from "../server.ts";
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
  });
};

Deno.test("forwards slash placed at the end of url", async () => {
  const targetUrl = "https://fresh.deno.dev/about";
  const resp = await router(new Request(targetUrl));
  assert(resp);
  assertEquals(resp.status, Status.PermanentRedirect);
  // forwarded location should be with trailing slash
  assertEquals(resp.headers.get("location"), targetUrl + "/");
});
