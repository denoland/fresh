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
// tests/main_test.ts

import { createHandler } from "$fresh/server.ts";
import manifest from "../fresh.gen.ts";
import { assertEquals, assertExists } from "$std/testing/asserts.ts";
import type { ConnInfo } from "../../../src/server/deps.ts";

const CONN_INFO: ConnInfo = {
  localAddr: { hostname: "127.0.0.1", port: 8000, transport: "tcp" },
  remoteAddr: { hostname: "127.0.0.1", port: 53496, transport: "tcp" },
};

Deno.test("HTTP assert test.", async (t) => {
  const handler = await createHandler(manifest);

  await t.step("#1 GET /", async () => {
    const response = await handler(new Request("http://127.0.0.1/"), CONN_INFO);
    assertEquals(response.status, 200);
  });

  await t.step("#2 POST /", async () => {
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
    const response = await handler(new Request("http://127.0.0.1/foo"), CONN_INFO);
    const text = await response.text();
    assertExists(text.match(/<div>Hello Foo!<\/div>/));
  });
});
```

### Execution Example

```sh
$ deno test --allow-read --allow-env --allow-net
running 1 test from ./tests/main_test.ts
HTTP assert test. ...
  #1 GET / ... ok (31ms)
  #2 POST / ... ok (35ms)
  #3 GET /foo ... ok (12ms)
HTTP assert test. ... ok (118ms)

ok | 1 passed (3 steps) | 0 failed (236ms)
```
