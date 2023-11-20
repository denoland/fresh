import { assertEquals } from "$std/assert/mod.ts";
import {
  jsxTemplateBufToVNode,
  parseJsxTemplateToBuf,
  Token,
} from "./jsx_precompile.tsx";
import { renderToString } from "../deps.ts";
import { h } from "preact";

interface AssertToken {
  token: Token;
  value: string;
}

function assertParseResult(
  tpl: string[],
  actual: number[],
  expected: AssertToken[],
) {
  const actualTokens: AssertToken[] = [];

  let tplIdx = 0;
  for (let i = 0; i < actual.length; i += 3) {
    const token = actual[i];
    switch (token) {
      case Token.ATTR_NAME:
      case Token.ATTR_VALUE:
      case Token.ELEM_OPEN_START:
      case Token.ELEM_CLOSE:
      case Token.TEXT:
        {
          const value = tpl[tplIdx].slice(actual[i + 1], actual[i + 2]);
          actualTokens.push({ token, value });
        }
        break;
      case Token.PLACEHOLDER:
        tplIdx++;
        actualTokens.push({ token, value: "" });
        break;
      case Token.ELEM_OPEN_END:
        actualTokens.push({ token, value: "" });
        break;
      default:
        throw new Error(`Token out of range: ${token}`);
    }
  }

  assertEquals(actualTokens, expected);
}

Deno.test("parse jsx precompile template", () => {
  const tpl = [
    `<html class="foo"><head><title>foo</title><meta content="foo" value="bar"><meta charset="utf-8"><style>.foo { color: red}</style><script>console.log(2);</script></head><body class="dark"><h1>hello</h1></body></html>`,
  ];
  const res = parseJsxTemplateToBuf(tpl);

  assertParseResult(tpl, res, [
    { token: Token.ELEM_OPEN_START, value: "html" },
    { token: Token.ATTR_NAME, value: "class" },
    { token: Token.ATTR_VALUE, value: "foo" },
    { token: Token.ELEM_OPEN_END, value: "" },
    { token: Token.ELEM_OPEN_START, value: "head" },
    { token: Token.ELEM_OPEN_END, value: "" },
    { token: Token.ELEM_OPEN_START, value: "title" },
    { token: Token.ELEM_OPEN_END, value: "" },
    { token: Token.TEXT, value: "foo" },
    { token: Token.ELEM_CLOSE, value: "" },
    { token: Token.ELEM_OPEN_START, value: "meta" },
    { token: Token.ATTR_NAME, value: "content" },
    { token: Token.ATTR_VALUE, value: "foo" },
    { token: Token.ATTR_NAME, value: "value" },
    { token: Token.ATTR_VALUE, value: "bar" },
    { token: Token.ELEM_OPEN_END, value: "" },
    { token: Token.ELEM_OPEN_START, value: "meta" },
    { token: Token.ATTR_NAME, value: "charset" },
    { token: Token.ATTR_VALUE, value: "utf-8" },
    { token: Token.ELEM_OPEN_END, value: "" },
    { token: Token.ELEM_OPEN_START, value: "style" },
    { token: Token.ELEM_OPEN_END, value: "" },
    { token: Token.TEXT, value: ".foo { color: red}" },
    { token: Token.ELEM_CLOSE, value: "" },
    { token: Token.ELEM_OPEN_START, value: "script" },
    { token: Token.ELEM_OPEN_END, value: "" },
    { token: Token.TEXT, value: "console.log(2);" },
    { token: Token.ELEM_CLOSE, value: "" },
    { token: Token.ELEM_CLOSE, value: "" },
    { token: Token.ELEM_OPEN_START, value: "body" },
    { token: Token.ATTR_NAME, value: "class" },
    { token: Token.ATTR_VALUE, value: "dark" },
    { token: Token.ELEM_OPEN_END, value: "" },
    { token: Token.ELEM_OPEN_START, value: "h1" },
    { token: Token.ELEM_OPEN_END, value: "" },
    { token: Token.TEXT, value: "hello" },
    { token: Token.ELEM_CLOSE, value: "" },
    { token: Token.ELEM_CLOSE, value: "" },
    { token: Token.ELEM_CLOSE, value: "" },
  ]);
});

Deno.test("parse jsx precompile template with placeholders", () => {
  const tpl = [
    `<div class="foo" `,
    ` `,
    `>foo`,
    `</div>`,
  ];
  const res = parseJsxTemplateToBuf(tpl);

  assertParseResult(tpl, res, [
    { token: Token.ELEM_OPEN_START, value: "div" },
    { token: Token.ATTR_NAME, value: "class" },
    { token: Token.ATTR_VALUE, value: "foo" },
    { token: Token.PLACEHOLDER, value: "" },
    { token: Token.PLACEHOLDER, value: "" },
    { token: Token.ELEM_OPEN_END, value: "" },
    { token: Token.TEXT, value: "foo" },
    { token: Token.PLACEHOLDER, value: "" },
    { token: Token.ELEM_CLOSE, value: "" },
  ]);
});

Deno.test("jsx template to vnode", () => {
  const tpl = [
    `<div class="foo" `,
    ` `,
    " ",
    `>foo`,
    "",
    "",
    `</div>`,
  ];
  const exprs = [
    `data-foo="foo"`,
    `required`,
    null,
    "bar",
    h("h1", {}, "hello world"),
    null,
  ];
  const buf = parseJsxTemplateToBuf(tpl);
  const vnode = jsxTemplateBufToVNode(buf, tpl, exprs);

  const html = renderToString(vnode);
  assertEquals(
    html,
    `<div class="foo" data-foo="foo" required>foobar<h1>hello world</h1></div>`,
  );
});
