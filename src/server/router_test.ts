import { assertEquals } from "./deps.ts";
import { IS_PATTERN, patternToRegExp } from "./router.ts";

function testPattern(input: string, test: string) {
  const regex = patternToRegExp(input);
  const match = test.match(regex);
  return (match !== null) ? match.groups ?? {} : null;
}

Deno.test("pathToRegexp", () => {
  assertEquals(testPattern("/:path", "/foo"), { path: "foo" });
  assertEquals(testPattern("/:path", "/foo/bar"), null);
  assertEquals(testPattern("/:path/bar", "/foo/bar"), { path: "foo" });
  assertEquals(testPattern("/foo/:path", "/foo/bar"), { path: "bar" });
  assertEquals(testPattern("/foo/:path", "/foo"), null);
  assertEquals(testPattern("/foo/*", "/foo/asd/asdh/"), {});
  assertEquals(testPattern("/foo{/bar}?", "/foo"), {});
  assertEquals(testPattern("/foo/(\\d+)", "/foo"), null);
  assertEquals(testPattern("/foo/(\\d+)", "/foo/1"), {});
  assertEquals(testPattern("/foo/(\\d+)", "/foo/11231"), {});
  assertEquals(testPattern("/foo/(bar)", "/foo/bar"), {});
  assertEquals(testPattern("/foo/:path*", "/foo/bar/asdf"), {
    path: "bar/asdf",
  });
  assertEquals(testPattern("/movies/:foo@:bar", "/movies/asdf@hehe"), {
    foo: "asdf",
    bar: "hehe",
  });
});

Deno.test("IS_PATTERN", () => {
  assertEquals(IS_PATTERN.test("/foo"), false);
  assertEquals(IS_PATTERN.test("/foo/bar/baz.jpg"), false);
  assertEquals(IS_PATTERN.test("/foo/:path"), true);
  assertEquals(IS_PATTERN.test("/foo/*"), true);
  assertEquals(IS_PATTERN.test("/foo{/bar}?"), true);
  assertEquals(IS_PATTERN.test("/foo/(\\d+)"), true);
  assertEquals(IS_PATTERN.test("/foo/(a)"), true);
});
