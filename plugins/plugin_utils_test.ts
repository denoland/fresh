import { assertEquals } from "$std/testing/asserts.ts";
import {
  extractClassNames,
  ExtractClassNamesOptions,
  ExtractResult,
} from "./plugin_utils.ts";

function testExtract(
  input: string,
  expected: ExtractResult,
  options: ExtractClassNamesOptions = {},
) {
  const res = extractClassNames(input, options);
  assertEquals(res, expected);
}

Deno.test("extract - css classes", () => {
  testExtract(`<div class="foo bar"></div>`, {
    classNames: "foo bar",
    html: `<div class="foo bar"></div>`,
  });
  testExtract(
    `<div class="foo bar-baz [boof]:current"></div>`,
    {
      classNames: "foo bar-baz [boof]:current",
      html: `<div class="foo bar-baz [boof]:current"></div>`,
    },
  );
  testExtract(
    `asdf<div class="foo bar-baz [boof]:current"></div>`,
    {
      classNames: "foo bar-baz [boof]:current",
      html: `asdf<div class="foo bar-baz [boof]:current"></div>`,
    },
  );
  testExtract(
    `asdf<div class="foo bar-baz [boof]:current"></div>asdf`,
    {
      classNames: "foo bar-baz [boof]:current",
      html: `asdf<div class="foo bar-baz [boof]:current"></div>asdf`,
    },
  );
  testExtract(
    `<div class="foo bar"></div><span class="baz bar"></span>`,
    {
      classNames: "foo bar baz bar",
      html: `<div class="foo bar"></div><span class="baz bar"></span>`,
    },
  );
});

Deno.test("extract - encoding", () => {
  testExtract(
    `<div class="[&amp;&gt;.foo]:bold"></div>`,
    {
      classNames: "[&>.foo]:bold",
      html: `<div class="[&amp;&gt;.foo]:bold"></div>`,
    },
    { decodeHtml: true },
  );
});

Deno.test("extract - normalize groups", () => {
  testExtract(`<div class="foo(bar baz)"></div>`, {
    classNames: "foo-bar foo-baz",
    html: `<div class="foo-bar foo-baz"></div>`,
  });

  testExtract(
    `<div class="shadow-lg group-hover:(shadow-xl opacity-70) rounded-lg"></div>`,
    {
      classNames:
        "shadow-lg group-hover:shadow-xl group-hover:opacity-70 rounded-lg",
      html:
        `<div class="shadow-lg group-hover:shadow-xl group-hover:opacity-70 rounded-lg"></div>`,
    },
  );
  testExtract(
    `<div class="border(b green-500)"></div>`,
    {
      classNames: "border-b border-green-500",
      html: `<div class="border-b border-green-500"></div>`,
    },
  );
  testExtract(
    `<a class="border(b green-500) p-3"></a>`,
    {
      classNames: "border-b border-green-500 p-3",
      html: `<a class="border-b border-green-500 p-3"></a>`,
    },
  );
  testExtract(
    `<img class="border(b green-500) p-3"/>`,
    {
      classNames: "border-b border-green-500 p-3",
      html: `<img class="border-b border-green-500 p-3"/>`,
    },
  );
});
