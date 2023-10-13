import { assertEquals } from "$std/testing/asserts.ts";
import { createComposeCtx } from "./compose.ts";
import { MethodRouter } from "./compose_router.ts";

async function dispatch(router: MethodRouter, req: Request): Promise<Response> {
  const handler = router.denoServerHandler();
  return await handler(req, {
    remoteAddr: {
      hostname: "localhost",
      port: 8080,
      transport: "tcp",
    },
  });
}

Deno.test("router.use()", async () => {
  const router = new MethodRouter()
    .use(() => new Response("foo"));

  const res = await dispatch(router, new Request("http://localhost/"));
  assertEquals(res.status, 200);
  assertEquals(await res.text(), "foo");
});
