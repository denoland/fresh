import { assertEquals } from "$std/testing/asserts.ts";
import { assertSnapshot } from "$std/testing/snapshot.ts";
import { createCodeFrame, getFirstUserFile } from "./code_frame.ts";
import { colors } from "./deps.ts";

function testCodeFrame(text: string, line: number, column: number) {
  const codeFrame = createCodeFrame(text, line, column);
  if (codeFrame !== undefined) {
    return "\n" + colors.stripColor(codeFrame);
  }
  return codeFrame;
}

const FILE = `file://example.com/foo.js`;

Deno.test("getFirstUserFile", () => {
  let stack = `Some message
  at asdf.foo (https://example.com/foo.js:8:20)
  at asdf.foo (${FILE}:8:20)
  `;
  assertEquals(getFirstUserFile(stack), {
    fnName: "asdf.foo",
    file: FILE,
    column: 20,
    line: 8,
  });

  stack = `Some message
  at asdf.foo (https://example.com/foo.js:8:20)
  at (${FILE}:8:20)
  `;
  assertEquals(getFirstUserFile(stack), {
    fnName: "",
    file: FILE,
    column: 20,
    line: 8,
  });
});

Deno.test("createCodeFrame invalid ranges", () => {
  assertEquals(createCodeFrame("", 2, 10), undefined);
  assertEquals(createCodeFrame("asdf", 2, 10), undefined);
  assertEquals(createCodeFrame("asdf", 1, 10), undefined);
});

Deno.test("createCodeFrame markers", async (t) => {
  await assertSnapshot(t, testCodeFrame("foo\nbar\nbaz", 1, 2));
  await assertSnapshot(t, testCodeFrame("foo\nbar\nbaz", 0, 0));
  await assertSnapshot(t, testCodeFrame("foo\nbar\nbaz", 2, 2));
  await assertSnapshot(
    t,
    testCodeFrame("foo\n\n\n\n\n\n\n\nbar\n\n\nbar", 8, 0),
  );
});

Deno.test("createCodeFrame with indentation", async (t) => {
  await assertSnapshot(t, testCodeFrame("foo\n      bar\nbaz", 1, 6));
  await assertSnapshot(t, testCodeFrame("foo\n\t\tbar\nbaz", 1, 2));
});
