import { expect } from "@std/expect";
import type { FsAdapter } from "../fs.ts";
import {
  FreshFileTransformer,
  isLazyResult,
  type ProcessFileResult,
} from "./file_transformer.ts";
import { delay } from "../test_utils.ts";

function testTransformer(files: Record<string, string>) {
  const mockFs: FsAdapter = {
    isDirectory: () => Promise.resolve(false),
    mkdirp: () => Promise.resolve(),
    walk: async function* foo() {
    },
    readFile: (file) => {
      if (file instanceof URL) throw new Error("Not supported");
      // deno-lint-ignore no-explicit-any
      const content = (files as any)[file];
      const buf = new TextEncoder().encode(content);
      return Promise.resolve(buf);
    },
  };
  return new FreshFileTransformer(mockFs);
}

async function consumeResult(result: ProcessFileResult[]) {
  const out: { path: string; content: string; map: string | null }[] = [];
  for (let i = 0; i < result.length; i++) {
    const file = result[i];
    if (isLazyResult(file)) {
      const res = await file.content();
      out.push({
        path: file.path,
        content: typeof res.content === "string"
          ? res.content
          : new TextDecoder().decode(res.content),
        map: res.map !== undefined
          ? typeof res.map === "string"
            ? res.map
            : new TextDecoder().decode(res.map)
          : null,
      });
    } else {
      out.push({
        path: file.path,
        content: typeof file.content === "string"
          ? file.content
          : new TextDecoder().decode(file.content),
        map: file.map !== null
          ? typeof file.map === "string"
            ? file.map
            : new TextDecoder().decode(file.map)
          : null,
      });
    }
  }

  return out;
}

Deno.test("FileTransformer - transform sync", async () => {
  const transformer = testTransformer({
    "foo.txt": "foo",
  });

  transformer.onTransform({ filter: /.*/ }, (args) => {
    return {
      content: args.text + "bar",
    };
  });

  const result = await transformer.process("foo.txt", "development", "");
  const files = await consumeResult(result!);
  expect(files).toEqual([
    { content: "foobar", map: null, path: "foo.txt" },
  ]);
});

Deno.test("FileTransformer - transform async", async () => {
  const transformer = testTransformer({
    "foo.txt": "foo",
  });

  transformer.onTransform({ filter: /.*/ }, async (args) => {
    await delay(1);
    return {
      content: args.text + "bar",
    };
  });

  const result = await transformer.process("foo.txt", "development", "");
  const files = await consumeResult(result!);
  expect(files).toEqual([
    { content: "foobar", map: null, path: "foo.txt" },
  ]);
});

Deno.test("FileTransformer - transform return Uint8Array", async () => {
  const transformer = testTransformer({
    "foo.txt": "foo",
  });

  transformer.onTransform({ filter: /.*/ }, () => {
    return {
      content: new TextEncoder().encode("foobar"),
    };
  });

  const result = await transformer.process("foo.txt", "development", "");
  const files = await consumeResult(result!);
  expect(files).toEqual([
    { content: "foobar", map: null, path: "foo.txt" },
  ]);
});

Deno.test("FileTransformer - lazy transform", async () => {
  const transformer = testTransformer({
    "foo.txt": "foo",
  });

  transformer.onTransform({ filter: /.*/ }, () => {
    return {
      content: async () => {
        await delay(1);
        return {
          content: new TextEncoder().encode("foobar"),
        };
      },
    };
  });

  const result = await transformer.process("foo.txt", "development", "");
  const files = await consumeResult(result!);
  expect(files).toEqual([
    { content: "foobar", map: null, path: "foo.txt" },
  ]);
});
