---
description: |
  By creating an application handler, you can write tests.
---

We can be create an application handler from `createHandler()` and use develop for testing HTTP.

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
import { superdeno } from "superdeno/mod.ts";
import { assertEquals } from "std/testing/asserts.ts";
import { type RequestHandlerLike } from "superdeno/src/types.ts";
import { Document, DOMParser } from "deno_dom/deno-dom-wasm.ts";

Deno.test("HTTP assert test.", async (t) => {
  await t.step("#1 GET /", async () => {
    const handler = await createHandler(manifest) as RequestHandlerLike;

    await superdeno(handler)
      .get("/")
      .expect(200);
  });

  await t.step("#2 POST /", async () => {
    const server = await createHandler(manifest) as RequestHandlerLike;

    await superdeno(server)
      .post("/")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send("text=Deno!")
      .expect(303);
  });

  await t.step("#3 GET /foo", async () => {
    const server = await createHandler(manifest) as RequestHandlerLike;

    const r = await superdeno(server)
      .get("/foo")
      .expect(200);

    const document: Document = new DOMParser().parseFromString(
      r.text,
      "text/html",
    )!;

    assertEquals(document.querySelector("div")?.innerText, "Hello Foo!");
  });

  await t.step("#4 GET /foo/bar", async () => {
    const server = await createHandler(manifest) as RequestHandlerLike;

    await superdeno(server)
      .get("/foo/bar")
      .expect(404);
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