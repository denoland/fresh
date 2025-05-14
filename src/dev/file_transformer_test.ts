import { expect } from "@std/expect";
import {
  FreshFileTransformer,
  type ProcessedFile,
} from "./file_transformer.ts";
import { delay } from "../test_utils.ts";
import { stub } from "@std/testing/mock";

function stubDenoReadFile(content: string) {
  return stub(Deno, "readFile", () => {
    return Promise.resolve(
      new TextEncoder().encode(content) as Uint8Array<ArrayBuffer>,
    );
  });
}

function consumeResult(result: ProcessedFile[]) {
  const out: {
    path: string;
    content: string;
    map: string | null;
    inputFiles: string[];
  }[] = [];
  for (let i = 0; i < result.length; i++) {
    const file = result[i];

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
      inputFiles: file.inputFiles,
    });
  }

  return out.sort((a, b) => a.path.localeCompare(b.path));
}

Deno.test("FileTransformer - transform sync", async () => {
  const transformer = new FreshFileTransformer();
  using _denoReadFileStub = stubDenoReadFile("foo");

  transformer.onTransform({ pluginName: "foo", filter: /.*/ }, (args) => {
    return {
      content: args.text + "bar",
    };
  });

  const result = await transformer.process("foo.txt", "development", "");
  const files = await consumeResult(result!);
  expect(files).toEqual([
    { content: "foobar", map: null, path: "foo.txt", inputFiles: ["foo.txt"] },
  ]);
});

Deno.test("FileTransformer - transform async", async () => {
  const transformer = new FreshFileTransformer();
  using _denoReadFileStub = stubDenoReadFile("foo");

  transformer.onTransform({ pluginName: "foo", filter: /.*/ }, async (args) => {
    await delay(1);
    return {
      content: args.text + "bar",
    };
  });

  const result = await transformer.process("foo.txt", "development", "");
  const files = await consumeResult(result!);
  expect(files).toEqual([
    { content: "foobar", map: null, path: "foo.txt", inputFiles: ["foo.txt"] },
  ]);
});

Deno.test("FileTransformer - transform return Uint8Array", async () => {
  const transformer = new FreshFileTransformer();
  using _denoReadFileStub = stubDenoReadFile("foo");

  transformer.onTransform({ pluginName: "foo", filter: /.*/ }, () => {
    return {
      content: new TextEncoder().encode("foobar"),
    };
  });

  const result = await transformer.process("foo.txt", "development", "");
  const files = await consumeResult(result!);
  expect(files).toEqual([
    { content: "foobar", map: null, path: "foo.txt", inputFiles: ["foo.txt"] },
  ]);
});

Deno.test("FileTransformer - pass transformed content", async () => {
  const transformer = new FreshFileTransformer();
  using _denoReadFileStub = stubDenoReadFile("input");

  transformer.onTransform({ pluginName: "A", filter: /.*/ }, (args) => {
    return {
      content: args.text + " -> A",
    };
  });
  transformer.onTransform({ pluginName: "B", filter: /.*/ }, (args) => {
    return {
      content: args.text + " -> B",
    };
  });

  const result = await transformer.process("input.txt", "development", "");
  const files = await consumeResult(result!);
  expect(files).toEqual([
    {
      content: "input -> A -> B",
      map: null,
      path: "input.txt",
      inputFiles: ["input.txt"],
    },
  ]);
});

Deno.test(
  "FileTransformer - pass transformed content with multiple",
  async () => {
    const transformer = new FreshFileTransformer();
    using _denoReadFileStub = stubDenoReadFile("input");

    transformer.onTransform({ pluginName: "A", filter: /.*/ }, (args) => {
      return [{
        path: args.path,
        content: args.text + " -> A",
      }];
    });
    transformer.onTransform({ pluginName: "B", filter: /.*/ }, (args) => {
      return {
        content: args.text + " -> B",
      };
    });

    const result = await transformer.process("input.txt", "development", "");
    const files = await consumeResult(result!);
    expect(files).toEqual([
      {
        content: "input -> A -> B",
        map: null,
        path: "input.txt",
        inputFiles: ["input.txt"],
      },
    ]);
  },
);

Deno.test("FileTransformer - return multiple results", async () => {
  const transformer = new FreshFileTransformer();
  using _denoReadFileStub = stubDenoReadFile("foo");

  const received: string[] = [];
  transformer.onTransform({ pluginName: "A", filter: /foo\.txt$/ }, () => {
    return [{
      path: "a.txt",
      content: "A",
    }, {
      path: "b.txt",
      content: "B",
    }];
  });
  transformer.onTransform({ pluginName: "B", filter: /.*/ }, (args) => {
    received.push(args.path);
  });

  const result = await transformer.process("foo.txt", "development", "");
  const files = await consumeResult(result!);
  expect(files).toEqual([
    { content: "A", map: null, path: "a.txt", inputFiles: ["foo.txt"] },
    { content: "B", map: null, path: "b.txt", inputFiles: ["foo.txt"] },
  ]);
  expect(received).toEqual(["foo.txt", "b.txt", "a.txt"]);
});

Deno.test(
  "FileTransformer - track input files through temporary results",
  async () => {
    const transformer = new FreshFileTransformer();
    using _denoReadFileStub = stubDenoReadFile("foo");

    transformer.onTransform({ pluginName: "A", filter: /foo\.txt$/ }, () => {
      return [{
        path: "a.txt",
        content: "A",
      }, {
        path: "b.txt",
        content: "B",
      }];
    });
    transformer.onTransform(
      { pluginName: "B", filter: /[ab]\.txt$/ },
      (args) => {
        return {
          path: "c" + args.path,
          content: args.text + "C",
        };
      },
    );

    const result = await transformer.process("foo.txt", "development", "");
    const files = await consumeResult(result!);
    expect(files).toEqual([
      { content: "AC", map: null, path: "ca.txt", inputFiles: ["foo.txt"] },
      { content: "BC", map: null, path: "cb.txt", inputFiles: ["foo.txt"] },
    ]);
  },
);
