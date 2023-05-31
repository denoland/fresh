---
description: |
  By creating an application handler, you can write tests.
---

We can be create an application handler from `createHandler()` and use develop
for testing HTTP.

An example of testing three URLs and two HTTP request methods is as follows

### handlers source

```tsx
// routes/index.tsx

import { HandlerContext, Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async POST(req: Request, ctx: HandlerContext) {
    const form = await req.formData();

    // Processing something

    return new Response("", {
      status: 303,
      headers: { Location: "/" },
    });
  },
};

export default function Index() {
  return (
    <div>
      Hello Deno!
    </div>
  );
}
```

```tsx
// routes/foo.tsx

export default function Foo() {
  return (
    <div>
      Hello Foo!
    </div>
  );
}
```

### Test code

```ts
// examples\test\test\main_test.ts

import { createHandler } from "$fresh/server.ts";
import manifest from "../fresh.gen.ts";
import { assertEquals, assertExists } from "$std/testing/asserts.ts";
import type { ConnInfo } from "../../../src/server/deps.ts";

const CONN_INFO: ConnInfo = {
  localAddr: { hostname: "127.0.0.1", port: 8000, transport: "tcp" },
  remoteAddr: { hostname: "127.0.0.1", port: 53496, transport: "tcp" },
};

Deno.test("HTTP assert test.", async (t) => {
  await t.step("#1 GET /", async () => {
    const handler = await createHandler(manifest);
    const response = await handler(new Request("http://127.0.0.1/"), CONN_INFO);

    assertEquals(response.status, 200);
  });

  await t.step("#2 POST /", async () => {
    const handler = await createHandler(manifest);

    const formData = new FormData();
    formData.append("text", "Deno!");

    const request = new Request("http://127.0.0.1/", {
      method: "POST",
      body: formData,
    });

    const response = await handler(request, CONN_INFO);

    assertEquals(response.status, 303);
  });

  await t.step("#3 GET /foo", async () => {
    const handler = await createHandler(manifest);

    const request = new Request("http://127.0.0.1/foo");

    const response = await handler(request, CONN_INFO);
    const text = await response.text();

    assertExists(text.match(/<div>Hello Foo!<\/div>/));
  });

  await t.step("#4 GET /foo/bar", async () => {
    const handler = await createHandler(manifest);

    const request = new Request("http://127.0.0.1/foo/bar");

    const response = await handler(request, CONN_INFO);

    assertEquals(response.status, 404);
  });
});
```

### import map

```jsonc
// import_map.json
{
  "imports": {
    "$fresh/": "../../",
    "preact": "https://esm.sh/preact@10.13.1",
    "preact/": "https://esm.sh/preact@10.13.1/",
    "preact-render-to-string": "https://esm.sh/*preact-render-to-string@5.2.6",
    "superdeno/": "https://deno.land/x/superdeno/",
    "std/testing/": "https://deno.land/std@0.190.0/testing/",
    "deno_dom/": "https://deno.land/x/deno_dom/"
  }
}
```

### Execution Example

```sh
$ deno test --allow-read --allow-env --allow-net
running 1 test from ./test/main_test.ts
HTTP assert test. ...
  #1 GET / ... ok (87ms)
  #2 POST / ... ok (79ms)
  #3 GET /foo ... ok (78ms)
  #4 GET /foo/bar ... ok (76ms)
HTTP assert test. ... ok (358ms)

ok | 1 passed (4 steps) | 0 failed (535ms)
```
