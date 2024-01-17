import { ServerContext } from "../server.ts";
import {
  assert,
  assertEquals,
  assertStringIncludes,
  STATUS_CODE,
} from "./deps.ts";
import manifest from "./fixture_disable_404/fresh.gen.ts";
import config from "./fixture_disable_404/fresh.config.ts";

const ctx = await ServerContext.fromManifest(manifest, config);
const handler = ctx.handler();

Deno.test({
  name: "/middleware - should pass state through all middlewares",
  fn: async () => {
    const resp = await handler(
      new Request("https://fresh.deno.dev/this-doesnt-exist"),
    );
    assert(resp);
    assertEquals(resp.status, STATUS_CODE.OK);

    const body = await resp.text();

    assertStringIncludes(body, "Bär");
    assert(
      !body.includes("This is a 404 page that no one will ever see."),
      `404 page inadvertently displayed`,
    );
  },
});

Deno.test({
  name: "disable 404 from middleware",
  fn: async () => {
    const resp = await handler(
      new Request("https://fresh.deno.dev/404-from-middleware"),
    );
    assert(resp);
    assertEquals(resp.status, STATUS_CODE.OK);

    const body = await resp.text();

    assertStringIncludes(body, "Bär");
    assert(
      !body.includes("This is a 404 page that no one will ever see."),
      `404 page inadvertently displayed`,
    );
  },
});
