import { createMiddlewareHandlerContext } from "$fresh-testing-library/server.ts";
import { expect } from "$fresh-testing-library/expect.ts";
import { handler } from "../../../www/routes/_middleware.ts";
import manifest from "../../../demo/fresh.gen.ts";

Deno.test("should return middleware status=200 & content-type", async () => {
  const req = new Request(`http://localhost:3000/`);
  // @ts-ignore ignores "type ... is not assignable to type Manifest" error
  const ctx = createMiddlewareHandlerContext(req, { manifest });
  const resp = await handler(req, ctx);
  // console.log("Response", resp);
  expect(resp.status).toBe(200);
  expect(resp.headers.get("content-type")).toBe("text/plain;charset=UTF-8");
});
