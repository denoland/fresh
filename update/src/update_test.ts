import * as path from "@std/path";
import {
  FRESH_VERSION,
  PREACT_SIGNALS_VERSION,
  PREACT_VERSION,
  update,
} from "./update.ts";
import { expect } from "@std/expect";
import { walk } from "https://deno.land/std@0.93.0/fs/walk.ts";

async function withTmpDir(fn: (dir: string) => void | Promise<void>) {
  const dir = await Deno.makeTempDir();

  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

async function writeFiles(dir: string, files: Record<string, string>) {
  const entries = Object.entries(files);
  await Promise.all(entries.map(async (entry) => {
    const [pathname, content] = entry;
    const fullPath = path.join(dir, pathname);
    try {
      await Deno.mkdir(path.dirname(fullPath), { recursive: true });
      await Deno.writeTextFile(fullPath, content);
    } catch (err) {
      if (!(err instanceof Deno.errors.AlreadyExists)) {
        throw err;
      }
    }
  }));
}

async function readFiles(dir: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};

  for await (
    const entry of walk(dir, { includeDirs: false, includeFiles: true })
  ) {
    const pathname = path.relative(dir, entry.path);
    const content = await Deno.readTextFile(entry.path);
    files[`/${pathname}`] = content.trim();
  }

  return files;
}

Deno.test("update - remove JSX pragma import", async () => {
  await withTmpDir(async (dir) => {
    await writeFiles(dir, {
      "/deno.json": `{}`,
      "/routes/index.tsx": `import { h, Fragment } from "preact";
/** @jsx h */
/** @jsxFrag Fragment */
export default function Foo() {
  return null;
}`,
    });

    await update(dir);
    const files = await readFiles(dir);

    expect(files["/routes/index.tsx"])
      .toEqual(`export default function Foo() {
  return null;
}`);
  });
});

Deno.test("update - 1.x project deno.json", async () => {
  await withTmpDir(async (dir) => {
    await writeFiles(dir, {
      "/deno.json": `{}`,
    });

    await update(dir);
    const files = await readFiles(dir);

    expect(JSON.parse(files["/deno.json"]))
      .toEqual({
        imports: {
          "@fresh/core": `jsr:@fresh/core@^${FRESH_VERSION}`,
          "@preact/signals": `npm:@preact/signals@^${PREACT_SIGNALS_VERSION}`,
          "preact": `npm:preact@^${PREACT_VERSION}`,
        },
      });
  });
});

Deno.test("update - 1.x project middlewares", async () => {
  await withTmpDir(async (dir) => {
    await writeFiles(dir, {
      "/deno.json": "{}",
      "/routes/_middleware.ts":
        `import { FreshContext } from "$fresh/server.ts";

interface State {
  data: string;
}

export async function handler(
  req: Request,
  ctx: FreshContext<State>,
) {
  ctx.state.data = "myData";
  ctx.state.url = req.url;
  const resp = await ctx.next();
  resp.headers.set("server", "fresh server");
  return resp;
}`,
    });

    await update(dir);
    const files = await readFiles(dir);

    expect(files["/routes/_middleware.ts"])
      .toEqual(`import { FreshContext } from "@fresh/core";

interface State {
  data: string;
}

export async function handler(
  ctx: FreshContext<State>,
) {
  const req = ctx.req;

  ctx.state.data = "myData";
  ctx.state.url = req.url;
  const resp = await ctx.next();
  resp.headers.set("server", "fresh server");
  return resp;
}`);
  });
});

Deno.test("update - 1.x update '$fresh/*' imports", async () => {
  await withTmpDir(async (dir) => {
    await writeFiles(dir, {
      "/deno.json": `{}`,
      "/routes/index.tsx": `import { PageProps } from "$fresh/server.ts";
export default function Foo(props: PageProps) {
  return null;
}`,
      "/routes/foo.tsx": `import { asset, Head } from "$fresh/runtime.ts";`,
    });

    await update(dir);
    const files = await readFiles(dir);

    expect(files["/routes/index.tsx"])
      .toEqual(`import { PageProps } from "@fresh/core";
export default function Foo(props: PageProps) {
  return null;
}`);
    expect(files["/routes/foo.tsx"])
      .toEqual(`import { asset } from "@fresh/core/runtime";`);
  });
});

Deno.test("update - 1.x update handler signature", async () => {
  await withTmpDir(async (dir) => {
    await writeFiles(dir, {
      "/deno.json": `{}`,
      "/routes/index.tsx": `import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(req, ctx) {},
  async POST(req, ctx) {},
  async PATCH(req, ctx) {},
  async PUT(req, ctx) {},
  async DELETE(req, ctx) {},
};`,
      "/routes/foo.tsx": `import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {},
  async POST(_req, ctx) {},
  async PATCH(_req, ctx) {},
  async PUT(_req, ctx) {},
  async DELETE(_req, ctx) {},
};`,
    });

    await update(dir);
    const files = await readFiles(dir);

    expect(files["/routes/index.tsx"])
      .toEqual(`import { Handlers } from "@fresh/core";

export const handler: Handlers = {
  async GET(ctx) {
    const req = ctx.req;
  },
  async POST(ctx) {
    const req = ctx.req;
  },
  async PATCH(ctx) {
    const req = ctx.req;
  },
  async PUT(ctx) {
    const req = ctx.req;
  },
  async DELETE(ctx) {
    const req = ctx.req;
  },
};`);
    expect(files["/routes/foo.tsx"])
      .toEqual(`import { Handlers } from "@fresh/core";

export const handler: Handlers = {
  async GET(ctx) {},
  async POST(ctx) {},
  async PATCH(ctx) {},
  async PUT(ctx) {},
  async DELETE(ctx) {},
};`);
  });
});
