import { expect } from "@std/expect";
import { PatternLexer, PatternPart, splitPattern, Token } from "./router2.ts";

function testLexer(input: string): PatternPart[] {
  const lexer = new PatternLexer();
  lexer.input = input;

  const out: PatternPart[] = [];
  lexer.next();
  while (lexer.token !== Token.EOF) {
    out.push({ token: lexer.token, value: lexer.value });
    lexer.next();
  }

  return out;
}

Deno.test("PatternLexer - word", () => {
  expect(testLexer("")).toEqual([]);
  expect(testLexer("/")).toEqual([{ token: Token.Slash, value: "" }]);
  expect(testLexer("/foo")).toEqual([
    { token: Token.Slash, value: "" },
    { token: Token.Word, value: "foo" },
  ]);
  expect(testLexer("/foo/bar")).toEqual([
    { token: Token.Slash, value: "" },
    { token: Token.Word, value: "foo" },
    { token: Token.Slash, value: "" },
    { token: Token.Word, value: "bar" },
  ]);
});

Deno.test("PatternLexer - wildcard", () => {
  expect(testLexer("/foo/*")).toEqual([
    { token: Token.Slash, value: "" },
    { token: Token.Word, value: "foo" },
    { token: Token.Slash, value: "" },
    { token: Token.Asteriks, value: "" },
  ]);
  expect(testLexer("/foo*")).toEqual([
    { token: Token.Slash, value: "" },
    { token: Token.Word, value: "foo" },
    { token: Token.Asteriks, value: "" },
  ]);
});

Deno.test("PatternLexer - param", () => {
  expect(testLexer("/:foo/:bar")).toEqual([
    { token: Token.Slash, value: "" },
    { token: Token.Colon, value: "" },
    { token: Token.Word, value: "foo" },
    { token: Token.Slash, value: "" },
    { token: Token.Colon, value: "" },
    { token: Token.Word, value: "bar" },
  ]);

  expect(testLexer("/:foo-a:bar")).toEqual([
    { token: Token.Slash, value: "" },
    { token: Token.Colon, value: "" },
    { token: Token.Word, value: "foo" },
    { token: Token.Word, value: "-a" },
    { token: Token.Colon, value: "" },
    { token: Token.Word, value: "bar" },
  ]);
});

Deno.test("PatternLexer - non-capturing", () => {
  expect(testLexer("/foo{bar}?")).toEqual([
    { token: Token.Slash, value: "" },
    { token: Token.Word, value: "foo" },
    { token: Token.CurlyOpen, value: "" },
    { token: Token.Word, value: "bar" },
    { token: Token.Question, value: "" },
  ]);
});

// Deno.test("splitPattern", () => {
//   expect(splitPattern("/")).toEqual([{ kind: "static", value: "/" }]);
//   expect(splitPattern("/foo")).toEqual(["/foo"]);
//   expect(splitPattern("/foo/bar")).toEqual(["/foo", "/bar"]);
//   expect(splitPattern("/foo/:bar")).toEqual(["/foo", "/:bar"]);
//   expect(splitPattern("/foo{/:bar}?")).toEqual(["/foo", "{/:bar}?"]);
// });
