import { assertEquals } from "./deps.ts";
import { IS_PATTERN, URLPathnamePattern } from "./router.ts";

function testPattern(pattern: string, value: string) {
  const regex = new URLPathnamePattern(pattern);
  return regex.exec(value);
}

Deno.test("pathToRegexp", () => {
  // URLPattern tests taken from https://github.com/web-platform-tests/wpt/tree/master/urlpattern/resources
  assertEquals(testPattern("/foo/bar", "/foo/bar"), {});
  assertEquals(testPattern("/foo/bar", "/foo/ba"), null);
  assertEquals(testPattern("/foo/bar", "/foo/bar/"), null);
  assertEquals(testPattern("/foo/bar", "/foo/bar/baz"), null);
  assertEquals(testPattern("/foo/bar", "?query#hash"), null);
  assertEquals(testPattern("/foo/:bar", "/foo/bar"), { bar: "bar" });
  assertEquals(testPattern("/foo/([^\\/]+?)", "/foo/bar"), { 0: "bar" });
  assertEquals(testPattern("/foo/:bar", "/foo/index.html"), {
    bar: "index.html",
  });
  assertEquals(testPattern("/foo/:bar", "/foo/bar/"), null);
  assertEquals(testPattern("/foo/:bar", "/foo/"), null);
  assertEquals(testPattern("/foo/(.*)", "/foo/bar"), { 0: "bar" });
  // FIXME
  // assertEquals(testPattern("/foo/*", "/foo/bar"), { 0: "bar" });
  // {
  //   "pattern": [{ "pathname": "/foo/*" }],
  //   "inputs": [{ "pathname": "/foo/bar" }],
  //   "expected_match": {
  //     "pathname": { "input": "/foo/bar", "groups": { "0": "bar" } },
  //   },
  // },
  assertEquals(testPattern("/foo/(.*)", "/foo/bar/baz"), { 0: "bar/baz" });
  // FIXME
  // assertEquals(testPattern("/foo/*", "/foo/bar/baz"), { 0: "bar/baz" });
  // {
  //   "pattern": [{ "pathname": "/foo/*" }],
  //   "inputs": [{ "pathname": "/foo/bar/baz" }],
  //   "expected_match": {
  //     "pathname": { "input": "/foo/bar/baz", "groups": { "0": "bar/baz" } },
  //   },
  // },

  assertEquals(testPattern("/foo/(.*)", "/foo/"), { 0: "" });
  // FIXME
  // assertEquals(testPattern("/foo/*", "/foo/"), { 0: "" });
  // {
  //   "pattern": [{ "pathname": "/foo/*" }],
  //   "inputs": [{ "pathname": "/foo/" }],
  //   "expected_match": {
  //     "pathname": { "input": "/foo/", "groups": { "0": "" } },
  //   },
  // },
  assertEquals(testPattern("/foo/(.*)", "/foo"), null);
  assertEquals(testPattern("/foo/*", "/foo"), null);
  assertEquals(testPattern("/foo/:bar(.*)", "/foo/bar"), { bar: "bar" });
  assertEquals(testPattern("/foo/:bar(.*)", "/foo/bar/baz"), {
    bar: "bar/baz",
  });
  assertEquals(testPattern("/foo/:bar(.*)", "/foo/"), {
    bar: "",
  });
  assertEquals(testPattern("/foo/:bar(.*)", "/foo"), null);
  assertEquals(testPattern("/foo/:bar?", "/foo/bar"), { bar: "bar" });
  // FIXME
  // assertEquals(testPattern("/foo/:bar?", "/foo"), { bar: undefiend });
  // {
  //   "pattern": [{ "pathname": "/foo/:bar?" }],
  //   "inputs": [{ "pathname": "/foo" }],
  //   "//": "The `null` below is translated to undefined in the test harness.",
  //   "expected_match": {
  //     "pathname": { "input": "/foo", "groups": { "bar": null } },
  //   },
  // },
  // FIXME
  // assertEquals(testPattern("/foo/:bar?", "/foo/"), null);
  // {
  //   "pattern": [{ "pathname": "/foo/:bar?" }],
  //   "inputs": [{ "pathname": "/foo/" }],
  //   "expected_match": null,
  // },
  assertEquals(testPattern("/foo/:bar?", "/foobar"), null);
  assertEquals(testPattern("/foo/:bar?", "/foo/bar/baz"), null);
  assertEquals(testPattern("/foo/:bar+", "/foo/bar"), { bar: "bar" });
  assertEquals(testPattern("/foo/:bar+", "/foo/bar"), { bar: "bar" });
  // FIXME
  // assertEquals(testPattern("/foo/:bar+", "/foo/bar/baz"), { bar: "bar/baz" });
  // {
  //   "pattern": [{ "pathname": "/foo/:bar+" }],
  //   "inputs": [{ "pathname": "/foo/bar/baz" }],
  //   "expected_match": {
  //     "pathname": { "input": "/foo/bar/baz", "groups": { "bar": "bar/baz" } },
  //   },
  // },
  assertEquals(testPattern("/foo/:bar+", "/foo"), null);
  assertEquals(testPattern("/foo/:bar+", "/foo/"), null);
  assertEquals(testPattern("/foo/:bar+", "/foobar"), null);
  assertEquals(testPattern("/foo/:bar*", "/foo/bar"), { bar: "bar" });
  assertEquals(testPattern("/foo/:bar*", "/foo/bar/baz"), { bar: "bar/baz" });
  // FIXME
  // assertEquals(testPattern("/foo/:bar*", "/foo"), {});
  // {
  //   "pattern": [{ "pathname": "/foo/:bar*" }],
  //   "inputs": [{ "pathname": "/foo" }],
  //   "//": "The `null` below is translated to undefined in the test harness.",
  //   "expected_match": {
  //     "pathname": { "input": "/foo", "groups": { "bar": null } },
  //   },
  // },
  // FIXME
  // assertEquals(testPattern("/foo/:bar*", "/foo/"), null);
  // {
  //   "pattern": [{ "pathname": "/foo/:bar*" }],
  //   "inputs": [{ "pathname": "/foo/" }],
  //   "expected_match": null,
  // },
  assertEquals(testPattern("/foo/:bar*", "/foobar"), null);
  assertEquals(testPattern("/foo/(.*)?", "/foo/bar"), { 0: "bar" });
  // FIXME
  // assertEquals(testPattern("/foo/*?", "/foo/bar"), { 0: "bar" });
  // {
  //   "pattern": [{ "pathname": "/foo/*?" }],
  //   "inputs": [{ "pathname": "/foo/bar" }],
  //   "expected_match": {
  //     "pathname": { "input": "/foo/bar", "groups": { "0": "bar" } },
  //   },
  // },
  assertEquals(testPattern("/foo/(.*)?", "/foo/bar/baz"), { 0: "bar/baz" });
  // FIXME
  // assertEquals(testPattern("/foo/*?", "/foo/bar/baz"), { 0: "bar/baz" });
  // {
  //   "pattern": [{ "pathname": "/foo/*?" }],
  //   "inputs": [{ "pathname": "/foo/bar/baz" }],
  //   "expected_match": {
  //     "pathname": { "input": "/foo/bar/baz", "groups": { "0": "bar/baz" } },
  //   },
  // },
  // assertEquals(testPattern("/foo/(.*)?", "/foo"), { 0: undefined });
  // {
  //   "pattern": [{ "pathname": "/foo/(.*)?" }],
  //   "inputs": [{ "pathname": "/foo" }],
  //   "expected_obj": {
  //     "pathname": "/foo/*?",
  //   },
  //   "//": "The `null` below is translated to undefined in the test harness.",
  //   "expected_match": {
  //     "pathname": { "input": "/foo", "groups": { "0": null } },
  //   },
  // },
  // assertEquals(testPattern("/foo/*?", "/foo"), { 0: undefined });
  // assertEquals(testPattern("/foo/(.*)?", "/foo/"), { 0: "" });
  // assertEquals(testPattern("/foo/*?", "/foo/"), { 0: "" });
  assertEquals(testPattern("/foo/(.*)?", "/foobar"), null);
  // assertEquals(testPattern("/foo/*?", "/foobar"), null);
  assertEquals(testPattern("/foo/(.*)?", "/fo"), null);
  // assertEquals(testPattern("/foo/*?", "/fo"), null);
  assertEquals(testPattern("/foo/(.*)+", "/foo/bar"), { 0: "bar" });
  // {
  //   "pattern": [{ "pathname": "/foo/(.*)+" }],
  //   "inputs": [{ "pathname": "/foo/bar" }],
  //   "expected_obj": {
  //     "pathname": "/foo/*+",
  //   },
  //   "expected_match": {
  //     "pathname": { "input": "/foo/bar", "groups": { "0": "bar" } },
  //   },
  // },
  // assertEquals(testPattern("/foo/*+", "/foo/bar"), { 0: "bar" });
  assertEquals(testPattern("/foo/(.*)+", "/foo/bar/baz"), { 0: "bar/baz" });
  // {
  //   "pattern": [{ "pathname": "/foo/(.*)+" }],
  //   "inputs": [{ "pathname": "/foo/bar/baz" }],
  //   "expected_obj": {
  //     "pathname": "/foo/*+",
  //   },
  //   "expected_match": {
  //     "pathname": { "input": "/foo/bar/baz", "groups": { "0": "bar/baz" } },
  //   },
  // },
  // assertEquals(testPattern("/foo/*+", "/foo/bar/baz"), { 0: "bar/baz" });
  assertEquals(testPattern("/foo/(.*)+", "/foo"), null);
  // assertEquals(testPattern("/foo/*+", "/foo"), null);
  assertEquals(testPattern("/foo/(.*)+", "/foo/"), { 0: "" });
  // assertEquals(testPattern("/foo/*+", "/foo/"), { 0: "" });
  assertEquals(testPattern("/foo/(.*)+", "/foobar"), null);
  // assertEquals(testPattern("/foo/*+", "/foobar"), null);
  assertEquals(testPattern("/foo/(.*)+", "/fo"), null);
  // assertEquals(testPattern("/foo/*+", "/fo"), null);
  assertEquals(testPattern("/foo/(.*)*", "/foo/bar"), { 0: "bar" });
  // assertEquals(testPattern("/foo/**", "/foo/bar"), { 0: "bar" });
  assertEquals(testPattern("/foo/(.*)*", "/foo/bar/baz"), { 0: "bar/baz" });
  // assertEquals(testPattern("/foo/**", "/foo/bar/baz"), { 0: "bar/baz" });
  // assertEquals(testPattern("/foo/(.*)*", "/foo"), { 0: undefined });
  // assertEquals(testPattern("/foo/**", "/foo"), { 0: undefined });
  assertEquals(testPattern("/foo/(.*)*", "/foo/"), { 0: "" });
  // assertEquals(testPattern("/foo/**", "/foo/"), { 0: "" });
  assertEquals(testPattern("/foo/(.*)*", "/foobar"), null);
  assertEquals(testPattern("/foo/**", "/foobar"), null);
  assertEquals(testPattern("/foo/(.*)*", "/fo"), null);
  assertEquals(testPattern("/foo/**", "/fo"), null);
  assertEquals(testPattern("/foo{/bar}", "/foo/bar"), {});
  // {
  //   "pattern": [{ "pathname": "/foo{/bar}" }],
  //   "inputs": [{ "pathname": "/foo/bar" }],
  //   "expected_obj": {
  //     "pathname": "/foo/bar",
  //   },
  //   "expected_match": {
  //     "pathname": { "input": "/foo/bar", "groups": {} },
  //   },
  // },
  assertEquals(testPattern("/foo{/bar}", "/foo/bar/baz"), null);
  assertEquals(testPattern("/foo{/bar}", "/foo"), null);
  assertEquals(testPattern("/foo{/bar}", "/foo/"), null);
  assertEquals(testPattern("/foo{/bar}?", "/foo/bar"), {});
  assertEquals(testPattern("/foo{/bar}?", "/foo/bar/baz"), null);
  assertEquals(testPattern("/foo{/bar}?", "/foo"), {});
  assertEquals(testPattern("/foo{/bar}?", "/foo/"), null);
  assertEquals(testPattern("/foo{/bar}+", "/foo/bar"), {});
  assertEquals(testPattern("/foo{/bar}+", "/foo/bar/bar"), {});
  assertEquals(testPattern("/foo{/bar}+", "/foo/bar/baz"), null);
  assertEquals(testPattern("/foo{/bar}+", "/foo"), null);
  assertEquals(testPattern("/foo{/bar}+", "/foo/"), null);
  assertEquals(testPattern("/foo{/bar}*", "/foo/bar"), {});
  assertEquals(testPattern("/foo{/bar}*", "/foo/bar/bar"), {});
  assertEquals(testPattern("/foo{/bar}*", "/foo/bar/baz"), {});
  // assertEquals(testPattern("/foo{/bar}*", "/foo"), {});
  assertEquals(testPattern("/foo{/bar}*", "/foo/"), null);
  // assertEquals(testPattern("(café)", "/foo/"), null);
  // {
  //   "pattern": [{ "pathname": "(café)" }],
  //   "expected_obj": "error",
  // },
  assertEquals(testPattern("/:café", "/foo"), { "café": "foo" });
  assertEquals(testPattern("/:\u2118", "/foo"), { "\u2118": "foo" });
  assertEquals(testPattern("/:\u3400", "/foo"), { "\u3400": "foo" });
  // assertEquals(testPattern("/foo/bar", "/foo/./bar"), {});
  // assertEquals(testPattern("/foo/baz", "/foo/bar/../baz"), {});
  // assertEquals(testPattern("/caf%C3%A9", "/café"), {});
  assertEquals(testPattern("/café", "/café"), {});
  assertEquals(testPattern("/caf%c3%a9", "/café"), null);
  // assertEquals(testPattern("/foo/bar", "foo/bar"), null);
  // assertEquals(testPattern("/foo/bar", "foo/bar"), {});
  // {
  //   "pattern": [{ "pathname": "/foo/bar" }],
  //   "inputs": [{ "pathname": "foo/bar", "baseURL": "https://example.com" }],
  //   "expected_match": {
  //     "protocol": { "input": "https", "groups": { "0": "https" } },
  //     "hostname": {
  //       "input": "example.com",
  //       "groups": { "0": "example.com" },
  //     },
  //     "pathname": { "input": "/foo/bar", "groups": {} },
  //   },
  // },
  // assertEquals(testPattern("/foo/../bar", "/bar"), {});
  // assertEquals(testPattern("./foo/bar", "/foo/bar"), {});
  // assertEquals(testPattern("./foo/bar", "/foo/bar"), {});
  // assertEquals(testPattern("", "/"), {});
  assertEquals(testPattern("{/bar}", "./bar"), null);
  assertEquals(testPattern("\\/bar", "./bar"), null);
  // {
  //   "pattern": [{ "pathname": "b", "baseURL": "https://example.com/foo/" }],
  //   "inputs": [{ "pathname": "./b", "baseURL": "https://example.com/foo/" }],
  //   "exactly_empty_components": ["port"],
  //   "expected_obj": {
  //     "pathname": "/foo/b",
  //   },
  //   "expected_match": {
  //     "protocol": { "input": "https", "groups": {} },
  //     "hostname": { "input": "example.com", "groups": {} },
  //     "pathname": { "input": "/foo/b", "groups": {} },
  //   },
  // },
  // {
  //   "pattern": [{ "pathname": "foo/bar" }],
  //   "inputs": ["https://example.com/foo/bar"],
  //   "expected_match": null,
  // },
  // {
  //   "pattern": [{ "pathname": "foo/bar", "baseURL": "https://example.com" }],
  //   "inputs": ["https://example.com/foo/bar"],
  //   "exactly_empty_components": ["port"],
  //   "expected_obj": {
  //     "pathname": "/foo/bar",
  //   },
  //   "expected_match": {
  //     "protocol": { "input": "https", "groups": {} },
  //     "hostname": { "input": "example.com", "groups": {} },
  //     "pathname": { "input": "/foo/bar", "groups": {} },
  //   },
  // },
  assertEquals(testPattern("/:name.html", "foo.html"), { name: "foo" });
  // {
  //   "pattern": [{
  //     "pathname": ":name.html",
  //     "baseURL": "https://example.com",
  //   }],
  //   "inputs": ["https://example.com/foo.html"],
  //   "exactly_empty_components": ["port"],
  //   "expected_obj": {
  //     "pathname": "/:name.html",
  //   },
  //   "expected_match": {
  //     "protocol": { "input": "https", "groups": {} },
  //     "hostname": { "input": "example.com", "groups": {} },
  //     "pathname": { "input": "/foo.html", "groups": { "name": "foo" } },
  //   },
  // },
  assertEquals(testPattern("/(blank|sourcedoc)", "blank"), { 0: "blank" });
  assertEquals(testPattern("/:number([0-9]+)", "8675309"), {
    number: "8675309",
  });
  // assertEquals(testPattern("/(\\m)", "8675309"), {
  //   number: "8675309",
  // });
  // {
  //   "pattern": [{ "pathname": "/(\\m)" }],
  //   "expected_obj": "error",
  // },
  assertEquals(testPattern("/foo!", "/foo!"), {});
  // assertEquals(testPattern("/foo\\:", "/foo:"), {});
  assertEquals(testPattern("/foo\\{", "/foo{"), {});
  assertEquals(testPattern("/foo\\{", "/foo%7B"), {});
  // assertEquals(testPattern("/foo\\(", "/foo("), {});
  // assertEquals(testPattern("/var x = 1;", "var%20x%20=%201;"), {});
  // {
  //   "pattern": [{ "protocol": "javascript", "pathname": "var x = 1;" }],
  //   "inputs": [{ "protocol": "javascript", "pathname": "var x = 1;" }],
  //   "expected_match": {
  //     "protocol": { "input": "javascript", "groups": {} },
  //     "pathname": { "input": "var x = 1;", "groups": {} },
  //   },
  // },
  // {
  //   "pattern": [{ "pathname": "var x = 1;" }],
  //   "inputs": [{ "protocol": "javascript", "pathname": "var x = 1;" }],
  //   "expected_obj": {
  //     "pathname": "var%20x%20=%201;",
  //   },
  //   "expected_match": null,
  // },
  assertEquals(testPattern("/:product/:endpoint", "/foo/bar"), {
    product: "foo",
    endpoint: "bar",
  });
  // assertEquals(testPattern("/*?foo", "/?foo"), null);
  // assertEquals(testPattern("/*", "/"), { 0: "" });
  // assertEquals(testPattern("/:name?foo", "/bar?foo"), null);
  // assertEquals(testPattern("/:name\\?foo", "/bar"), null);
  // {
  //   "pattern": ["https://example.com/:name\\?foo"],
  //   "inputs": ["https://example.com/bar?foo"],
  //   "exactly_empty_components": ["port"],
  //   "expected_obj": {
  //     "protocol": "https",
  //     "hostname": "example.com",
  //     "pathname": "/:name",
  //     "search": "foo",
  //   },
  //   "expected_match": {
  //     "protocol": { "input": "https", "groups": {} },
  //     "hostname": { "input": "example.com", "groups": {} },
  //     "pathname": { "input": "/bar", "groups": { "name": "bar" } },
  //     "search": { "input": "foo", "groups": {} },
  //   },
  // },
  assertEquals(testPattern("/(bar)?foo", "/bar?foo"), null);
  assertEquals(testPattern("/(bar)", "/bar"), { 0: "bar" });
  assertEquals(testPattern("/{bar}?foo", "/bar?foo"), null);
  assertEquals(testPattern("/{bar}", "/bar"), {});
  assertEquals(testPattern("/foobar", "/bar"), {});
  // assertEquals(testPattern("/*", "/foo"), {});
  // {
  //   "pattern": ["https://(sub.)?example(.com/)foo"],
  //   "inputs": ["https://example.com/foo"],
  //   "exactly_empty_components": ["port"],
  //   "expected_obj": {
  //     "protocol": "https",
  //     "hostname": "(sub.)?example(.com/)foo",
  //     "pathname": "*",
  //   },
  //   "expected_match": null,
  // },
  assertEquals(testPattern("/foobar", "/bar"), {});
  // assertEquals(testPattern("/*", "/foo"), { 0: "/foo" });
  // assertEquals(
  //   testPattern("/foo\\:bar@example.com", "/foo:bar@example.com"),
  //   {},
  // );
  // assertEquals(testPattern("/data\\:channel.html", "/data:channel.html"), {});
  [
    {
      "pattern": ["data{\\:}channel.html", "https://example.com"],
      "inputs": ["https://example.com/data:channel.html"],
      "exactly_empty_components": ["port"],
      "expected_obj": {
        "protocol": "https",
        "hostname": "example.com",
        "pathname": "/data\\:channel.html",
        "search": "*",
        "hash": "*",
      },
      "expected_match": {
        "protocol": { "input": "https", "groups": {} },
        "hostname": { "input": "example.com", "groups": {} },
        "pathname": { "input": "/data:channel.html", "groups": {} },
      },
    },
    {
      "pattern": ["http://[\\:\\:1]/"],
      "inputs": ["http://[::1]/"],
      "exactly_empty_components": ["port"],
      "expected_obj": {
        "protocol": "http",
        "hostname": "[\\:\\:1]",
        "pathname": "/",
      },
      "expected_match": {
        "protocol": { "input": "http", "groups": {} },
        "hostname": { "input": "[::1]", "groups": {} },
        "pathname": { "input": "/", "groups": {} },
      },
    },
    {
      "pattern": ["http://[\\:\\:1]:8080/"],
      "inputs": ["http://[::1]:8080/"],
      "expected_obj": {
        "protocol": "http",
        "hostname": "[\\:\\:1]",
        "port": "8080",
        "pathname": "/",
      },
      "expected_match": {
        "protocol": { "input": "http", "groups": {} },
        "hostname": { "input": "[::1]", "groups": {} },
        "port": { "input": "8080", "groups": {} },
        "pathname": { "input": "/", "groups": {} },
      },
    },
    {
      "pattern": ["http://[\\:\\:a]/"],
      "inputs": ["http://[::a]/"],
      "exactly_empty_components": ["port"],
      "expected_obj": {
        "protocol": "http",
        "hostname": "[\\:\\:a]",
        "pathname": "/",
      },
      "expected_match": {
        "protocol": { "input": "http", "groups": {} },
        "hostname": { "input": "[::a]", "groups": {} },
        "pathname": { "input": "/", "groups": {} },
      },
    },
    {
      "pattern": ["http://[:address]/"],
      "inputs": ["http://[::1]/"],
      "exactly_empty_components": ["port"],
      "expected_obj": {
        "protocol": "http",
        "hostname": "[:address]",
        "pathname": "/",
      },
      "expected_match": {
        "protocol": { "input": "http", "groups": {} },
        "hostname": { "input": "[::1]", "groups": { "address": "::1" } },
        "pathname": { "input": "/", "groups": {} },
      },
    },
    {
      "pattern": ["http://[\\:\\:AB\\::num]/"],
      "inputs": ["http://[::ab:1]/"],
      "exactly_empty_components": ["port"],
      "expected_obj": {
        "protocol": "http",
        "hostname": "[\\:\\:ab\\::num]",
        "pathname": "/",
      },
      "expected_match": {
        "protocol": { "input": "http", "groups": {} },
        "hostname": { "input": "[::ab:1]", "groups": { "num": "1" } },
        "pathname": { "input": "/", "groups": {} },
      },
    },
    {
      "pattern": [{ "hostname": "[\\:\\:AB\\::num]" }],
      "inputs": [{ "hostname": "[::ab:1]" }],
      "expected_obj": {
        "hostname": "[\\:\\:ab\\::num]",
      },
      "expected_match": {
        "hostname": { "input": "[::ab:1]", "groups": { "num": "1" } },
      },
    },
    {
      "pattern": [{ "hostname": "[\\:\\:xY\\::num]" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "{[\\:\\:ab\\::num]}" }],
      "inputs": [{ "hostname": "[::ab:1]" }],
      "expected_match": {
        "hostname": { "input": "[::ab:1]", "groups": { "num": "1" } },
      },
    },
    {
      "pattern": [{ "hostname": "{[\\:\\:fé\\::num]}" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "{[\\:\\::num\\:1]}" }],
      "inputs": [{ "hostname": "[::ab:1]" }],
      "expected_match": {
        "hostname": { "input": "[::ab:1]", "groups": { "num": "ab" } },
      },
    },
    {
      "pattern": [{ "hostname": "{[\\:\\::num\\:fé]}" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "[*\\:1]" }],
      "inputs": [{ "hostname": "[::ab:1]" }],
      "expected_match": {
        "hostname": { "input": "[::ab:1]", "groups": { "0": "::ab" } },
      },
    },
    {
      "pattern": [{ "hostname": "*\\:1]" }],
      "expected_obj": "error",
    },
    {
      "pattern": ["https://foo{{@}}example.com"],
      "inputs": ["https://foo@example.com"],
      "expected_obj": "error",
    },
    {
      "pattern": ["https://foo{@example.com"],
      "inputs": ["https://foo@example.com"],
      "expected_obj": "error",
    },
    {
      "pattern": ["data\\:text/javascript,let x = 100/:tens?5;"],
      "inputs": ["data:text/javascript,let x = 100/5;"],
      "exactly_empty_components": ["hostname", "port"],
      "expected_obj": {
        "protocol": "data",
        "pathname": "text/javascript,let x = 100/:tens?5;",
      },
      "//": "The `null` below is translated to undefined in the test harness.",
      "expected_match": {
        "protocol": { "input": "data", "groups": {} },
        "pathname": {
          "input": "text/javascript,let x = 100/5;",
          "groups": { "tens": null },
        },
      },
    },
    {
      "pattern": [{ "pathname": "/:id/:id" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "pathname": "/foo", "baseURL": "" }],
      "expected_obj": "error",
    },
    {
      "pattern": ["/foo", ""],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "pathname": "/foo" }, "https://example.com"],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "pathname": ":name*" }],
      "inputs": [{ "pathname": "foobar" }],
      "expected_match": {
        "pathname": { "input": "foobar", "groups": { "name": "foobar" } },
      },
    },
    {
      "pattern": [{ "pathname": ":name+" }],
      "inputs": [{ "pathname": "foobar" }],
      "expected_match": {
        "pathname": { "input": "foobar", "groups": { "name": "foobar" } },
      },
    },
    {
      "pattern": [{ "pathname": ":name" }],
      "inputs": [{ "pathname": "foobar" }],
      "expected_match": {
        "pathname": { "input": "foobar", "groups": { "name": "foobar" } },
      },
    },
    {
      "pattern": [{ "protocol": ":name*" }],
      "inputs": [{ "protocol": "foobar" }],
      "expected_match": {
        "protocol": { "input": "foobar", "groups": { "name": "foobar" } },
      },
    },
    {
      "pattern": [{ "protocol": ":name+" }],
      "inputs": [{ "protocol": "foobar" }],
      "expected_match": {
        "protocol": { "input": "foobar", "groups": { "name": "foobar" } },
      },
    },
    {
      "pattern": [{ "protocol": ":name" }],
      "inputs": [{ "protocol": "foobar" }],
      "expected_match": {
        "protocol": { "input": "foobar", "groups": { "name": "foobar" } },
      },
    },
    {
      "pattern": [{ "hostname": "bad hostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad#hostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad%hostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad/hostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad\\:hostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad<hostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad>hostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad?hostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad@hostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad[hostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad]hostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad\\\\hostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad^hostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad|hostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad\nhostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad\rhostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "hostname": "bad\thostname" }],
      "expected_obj": "error",
    },
    {
      "pattern": [{}],
      "inputs": ["https://example.com/"],
      "expected_match": {
        "protocol": { "input": "https", "groups": { "0": "https" } },
        "hostname": {
          "input": "example.com",
          "groups": { "0": "example.com" },
        },
        "pathname": { "input": "/", "groups": { "0": "/" } },
      },
    },
    {
      "pattern": [],
      "inputs": ["https://example.com/"],
      "expected_match": {
        "protocol": { "input": "https", "groups": { "0": "https" } },
        "hostname": {
          "input": "example.com",
          "groups": { "0": "example.com" },
        },
        "pathname": { "input": "/", "groups": { "0": "/" } },
      },
    },
    {
      "pattern": [],
      "inputs": [{}],
      "expected_match": {},
    },
    {
      "pattern": [],
      "inputs": [],
      "expected_match": { "inputs": [{}] },
    },
    {
      "pattern": [{ "pathname": "(foo)(.*)" }],
      "inputs": [{ "pathname": "foobarbaz" }],
      "expected_match": {
        "pathname": {
          "input": "foobarbaz",
          "groups": { "0": "foo", "1": "barbaz" },
        },
      },
    },
    {
      "pattern": [{ "pathname": "{(foo)bar}(.*)" }],
      "inputs": [{ "pathname": "foobarbaz" }],
      "expected_match": {
        "pathname": {
          "input": "foobarbaz",
          "groups": { "0": "foo", "1": "baz" },
        },
      },
    },
    {
      "pattern": [{ "pathname": "(foo)?(.*)" }],
      "inputs": [{ "pathname": "foobarbaz" }],
      "expected_obj": {
        "pathname": "(foo)?*",
      },
      "expected_match": {
        "pathname": {
          "input": "foobarbaz",
          "groups": { "0": "foo", "1": "barbaz" },
        },
      },
    },
    {
      "pattern": [{ "pathname": "{:foo}(.*)" }],
      "inputs": [{ "pathname": "foobarbaz" }],
      "expected_match": {
        "pathname": {
          "input": "foobarbaz",
          "groups": { "foo": "f", "0": "oobarbaz" },
        },
      },
    },
    {
      "pattern": [{ "pathname": "{:foo}(barbaz)" }],
      "inputs": [{ "pathname": "foobarbaz" }],
      "expected_match": {
        "pathname": {
          "input": "foobarbaz",
          "groups": { "foo": "foo", "0": "barbaz" },
        },
      },
    },
    {
      "pattern": [{ "pathname": "{:foo}{(.*)}" }],
      "inputs": [{ "pathname": "foobarbaz" }],
      "expected_obj": {
        "pathname": "{:foo}(.*)",
      },
      "expected_match": {
        "pathname": {
          "input": "foobarbaz",
          "groups": { "foo": "f", "0": "oobarbaz" },
        },
      },
    },
    {
      "pattern": [{ "pathname": "{:foo}{(.*)bar}" }],
      "inputs": [{ "pathname": "foobarbaz" }],
      "expected_obj": {
        "pathname": ":foo{*bar}",
      },
      "expected_match": null,
    },
    {
      "pattern": [{ "pathname": "{:foo}{bar(.*)}" }],
      "inputs": [{ "pathname": "foobarbaz" }],
      "expected_obj": {
        "pathname": ":foo{bar*}",
      },
      "expected_match": {
        "pathname": {
          "input": "foobarbaz",
          "groups": { "foo": "foo", "0": "baz" },
        },
      },
    },
    {
      "pattern": [{ "pathname": "{:foo}:bar(.*)" }],
      "inputs": [{ "pathname": "foobarbaz" }],
      "expected_obj": {
        "pathname": ":foo:bar(.*)",
      },
      "expected_match": {
        "pathname": {
          "input": "foobarbaz",
          "groups": { "foo": "f", "bar": "oobarbaz" },
        },
      },
    },
    {
      "pattern": [{ "pathname": "{:foo}?(.*)" }],
      "inputs": [{ "pathname": "foobarbaz" }],
      "expected_obj": {
        "pathname": ":foo?*",
      },
      "expected_match": {
        "pathname": {
          "input": "foobarbaz",
          "groups": { "foo": "f", "0": "oobarbaz" },
        },
      },
    },
    {
      "pattern": [{ "pathname": "{:foo\\bar}" }],
      "inputs": [{ "pathname": "foobar" }],
      "expected_match": {
        "pathname": { "input": "foobar", "groups": { "foo": "foo" } },
      },
    },
    {
      "pattern": [{ "pathname": "{:foo\\.bar}" }],
      "inputs": [{ "pathname": "foo.bar" }],
      "expected_obj": {
        "pathname": "{:foo.bar}",
      },
      "expected_match": {
        "pathname": { "input": "foo.bar", "groups": { "foo": "foo" } },
      },
    },
    {
      "pattern": [{ "pathname": "{:foo(foo)bar}" }],
      "inputs": [{ "pathname": "foobar" }],
      "expected_match": {
        "pathname": { "input": "foobar", "groups": { "foo": "foo" } },
      },
    },
    {
      "pattern": [{ "pathname": "{:foo}bar" }],
      "inputs": [{ "pathname": "foobar" }],
      "expected_match": {
        "pathname": { "input": "foobar", "groups": { "foo": "foo" } },
      },
    },
    {
      "pattern": [{ "pathname": ":foo\\bar" }],
      "inputs": [{ "pathname": "foobar" }],
      "expected_obj": {
        "pathname": "{:foo}bar",
      },
      "expected_match": {
        "pathname": { "input": "foobar", "groups": { "foo": "foo" } },
      },
    },
    {
      "pattern": [{ "pathname": ":foo{}(.*)" }],
      "inputs": [{ "pathname": "foobar" }],
      "expected_obj": {
        "pathname": "{:foo}(.*)",
      },
      "expected_match": {
        "pathname": {
          "input": "foobar",
          "groups": { "foo": "f", "0": "oobar" },
        },
      },
    },
    {
      "pattern": [{ "pathname": ":foo{}bar" }],
      "inputs": [{ "pathname": "foobar" }],
      "expected_obj": {
        "pathname": "{:foo}bar",
      },
      "expected_match": {
        "pathname": { "input": "foobar", "groups": { "foo": "foo" } },
      },
    },
    {
      "pattern": [{ "pathname": ":foo{}?bar" }],
      "inputs": [{ "pathname": "foobar" }],
      "expected_obj": {
        "pathname": "{:foo}bar",
      },
      "expected_match": {
        "pathname": { "input": "foobar", "groups": { "foo": "foo" } },
      },
    },
    {
      "pattern": [{ "pathname": "*{}**?" }],
      "inputs": [{ "pathname": "foobar" }],
      "expected_obj": {
        "pathname": "*(.*)?",
      },
      "//": "The `null` below is translated to undefined in the test harness.",
      "expected_match": {
        "pathname": {
          "input": "foobar",
          "groups": { "0": "foobar", "1": null },
        },
      },
    },
    {
      "pattern": [{ "pathname": ":foo(baz)(.*)" }],
      "inputs": [{ "pathname": "bazbar" }],
      "expected_match": {
        "pathname": {
          "input": "bazbar",
          "groups": { "foo": "baz", "0": "bar" },
        },
      },
    },
    {
      "pattern": [{ "pathname": ":foo(baz)bar" }],
      "inputs": [{ "pathname": "bazbar" }],
      "expected_match": {
        "pathname": { "input": "bazbar", "groups": { "foo": "baz" } },
      },
    },
    {
      "pattern": [{ "pathname": "*/*" }],
      "inputs": [{ "pathname": "foo/bar" }],
      "expected_match": {
        "pathname": {
          "input": "foo/bar",
          "groups": { "0": "foo", "1": "bar" },
        },
      },
    },
    {
      "pattern": [{ "pathname": "*\\/*" }],
      "inputs": [{ "pathname": "foo/bar" }],
      "expected_obj": {
        "pathname": "*/{*}",
      },
      "expected_match": {
        "pathname": {
          "input": "foo/bar",
          "groups": { "0": "foo", "1": "bar" },
        },
      },
    },
    {
      "pattern": [{ "pathname": "*/{*}" }],
      "inputs": [{ "pathname": "foo/bar" }],
      "expected_match": {
        "pathname": {
          "input": "foo/bar",
          "groups": { "0": "foo", "1": "bar" },
        },
      },
    },
    {
      "pattern": [{ "pathname": "*//*" }],
      "inputs": [{ "pathname": "foo/bar" }],
      "expected_match": null,
    },
    {
      "pattern": [{ "pathname": "/:foo." }],
      "inputs": [{ "pathname": "/bar." }],
      "expected_match": {
        "pathname": { "input": "/bar.", "groups": { "foo": "bar" } },
      },
    },
    {
      "pattern": [{ "pathname": "/:foo.." }],
      "inputs": [{ "pathname": "/bar.." }],
      "expected_match": {
        "pathname": { "input": "/bar..", "groups": { "foo": "bar" } },
      },
    },
    {
      "pattern": [{ "pathname": "./foo" }],
      "inputs": [{ "pathname": "./foo" }],
      "expected_match": {
        "pathname": { "input": "./foo", "groups": {} },
      },
    },
    {
      "pattern": [{ "pathname": "../foo" }],
      "inputs": [{ "pathname": "../foo" }],
      "expected_match": {
        "pathname": { "input": "../foo", "groups": {} },
      },
    },
    {
      "pattern": [{ "pathname": ":foo./" }],
      "inputs": [{ "pathname": "bar./" }],
      "expected_match": {
        "pathname": { "input": "bar./", "groups": { "foo": "bar" } },
      },
    },
    {
      "pattern": [{ "pathname": ":foo../" }],
      "inputs": [{ "pathname": "bar../" }],
      "expected_match": {
        "pathname": { "input": "bar../", "groups": { "foo": "bar" } },
      },
    },
    {
      "pattern": [{ "pathname": "/:foo\\bar" }],
      "inputs": [{ "pathname": "/bazbar" }],
      "expected_obj": {
        "pathname": "{/:foo}bar",
      },
      "expected_match": {
        "pathname": { "input": "/bazbar", "groups": { "foo": "baz" } },
      },
    },
    {
      "pattern": [{ "pathname": "/foo/bar" }, { "ignoreCase": true }],
      "inputs": [{ "pathname": "/FOO/BAR" }],
      "expected_match": {
        "pathname": { "input": "/FOO/BAR", "groups": {} },
      },
    },
    {
      "pattern": [{ "ignoreCase": true }],
      "inputs": [{ "pathname": "/FOO/BAR" }],
      "expected_match": {
        "pathname": { "input": "/FOO/BAR", "groups": { "0": "/FOO/BAR" } },
      },
    },
    {
      "pattern": ["https://example.com:8080/foo?bar#baz", {
        "ignoreCase": true,
      }],
      "inputs": [{
        "pathname": "/FOO",
        "search": "BAR",
        "hash": "BAZ",
        "baseURL": "https://example.com:8080",
      }],
      "expected_obj": {
        "protocol": "https",
        "hostname": "example.com",
        "port": "8080",
        "pathname": "/foo",
        "search": "bar",
        "hash": "baz",
      },
      "expected_match": {
        "protocol": { "input": "https", "groups": {} },
        "hostname": { "input": "example.com", "groups": {} },
        "port": { "input": "8080", "groups": {} },
        "pathname": { "input": "/FOO", "groups": {} },
        "search": { "input": "BAR", "groups": {} },
        "hash": { "input": "BAZ", "groups": {} },
      },
    },
    {
      "pattern": ["/foo?bar#baz", "https://example.com:8080", {
        "ignoreCase": true,
      }],
      "inputs": [{
        "pathname": "/FOO",
        "search": "BAR",
        "hash": "BAZ",
        "baseURL": "https://example.com:8080",
      }],
      "expected_obj": {
        "protocol": "https",
        "hostname": "example.com",
        "port": "8080",
        "pathname": "/foo",
        "search": "bar",
        "hash": "baz",
      },
      "expected_match": {
        "protocol": { "input": "https", "groups": {} },
        "hostname": { "input": "example.com", "groups": {} },
        "port": { "input": "8080", "groups": {} },
        "pathname": { "input": "/FOO", "groups": {} },
        "search": { "input": "BAR", "groups": {} },
        "hash": { "input": "BAZ", "groups": {} },
      },
    },
    {
      "pattern": [
        "/foo?bar#baz",
        { "ignoreCase": true },
        "https://example.com:8080",
      ],
      "inputs": [{
        "pathname": "/FOO",
        "search": "BAR",
        "hash": "BAZ",
        "baseURL": "https://example.com:8080",
      }],
      "expected_obj": "error",
    },
    {
      "pattern": [{ "search": "foo", "baseURL": "https://example.com/a/+/b" }],
      "inputs": [{ "search": "foo", "baseURL": "https://example.com/a/+/b" }],
      "exactly_empty_components": ["port"],
      "expected_obj": {
        "pathname": "/a/\\+/b",
      },
      "expected_match": {
        "hostname": { "input": "example.com", "groups": {} },
        "pathname": { "input": "/a/+/b", "groups": {} },
        "protocol": { "input": "https", "groups": {} },
        "search": { "input": "foo", "groups": {} },
      },
    },
    {
      "pattern": [{
        "hash": "foo",
        "baseURL": "https://example.com/?q=*&v=?&hmm={}&umm=()",
      }],
      "inputs": [{
        "hash": "foo",
        "baseURL": "https://example.com/?q=*&v=?&hmm={}&umm=()",
      }],
      "exactly_empty_components": ["port"],
      "expected_obj": {
        "search": "q=\\*&v=\\?&hmm=\\{\\}&umm=\\(\\)",
      },
      "expected_match": {
        "hostname": { "input": "example.com", "groups": {} },
        "pathname": { "input": "/", "groups": {} },
        "protocol": { "input": "https", "groups": {} },
        "search": { "input": "q=*&v=?&hmm={}&umm=()", "groups": {} },
        "hash": { "input": "foo", "groups": {} },
      },
    },
    {
      "pattern": ["#foo", "https://example.com/?q=*&v=?&hmm={}&umm=()"],
      "inputs": ["https://example.com/?q=*&v=?&hmm={}&umm=()#foo"],
      "exactly_empty_components": ["port"],
      "expected_obj": {
        "search": "q=\\*&v=\\?&hmm=\\{\\}&umm=\\(\\)",
        "hash": "foo",
      },
      "expected_match": {
        "hostname": { "input": "example.com", "groups": {} },
        "pathname": { "input": "/", "groups": {} },
        "protocol": { "input": "https", "groups": {} },
        "search": { "input": "q=*&v=?&hmm={}&umm=()", "groups": {} },
        "hash": { "input": "foo", "groups": {} },
      },
    },
    {
      "pattern": [{ "pathname": "/([[a-z]--a])" }],
      "inputs": [{ "pathname": "/a" }],
      "expected_match": null,
    },
    {
      "pattern": [{ "pathname": "/([[a-z]--a])" }],
      "inputs": [{ "pathname": "/z" }],
      "expected_match": {
        "pathname": { "input": "/z", "groups": { "0": "z" } },
      },
    },
    {
      "pattern": [{ "pathname": "/([\\d&&[0-1]])" }],
      "inputs": [{ "pathname": "/0" }],
      "expected_match": {
        "pathname": { "input": "/0", "groups": { "0": "0" } },
      },
    },
    {
      "pattern": [{ "pathname": "/([\\d&&[0-1]])" }],
      "inputs": [{ "pathname": "/3" }],
      "expected_match": null,
    },
  ];

  // assertEquals(testPattern("/:path", "/foo"), { path: "foo" });
  // assertEquals(testPattern("/:path", "/foo/bar"), null);
  // assertEquals(testPattern("/:path/bar", "/foo/bar"), { path: "foo" });
  // assertEquals(testPattern("/foo/:path", "/foo/bar"), { path: "bar" });
  // assertEquals(testPattern("/foo/:path", "/foo"), null);
  // assertEquals(testPattern("/foo/*", "/foo/asd/asdh/"), {});
  // assertEquals(testPattern("/foo{/bar}?", "/foo"), {});
  // assertEquals(testPattern("/foo{/bar}?", "/foo/bar"), {});
  // assertEquals(testPattern("/foo/(\\d+)", "/foo"), null);
  // assertEquals(testPattern("/foo/(\\d+)", "/foo/1"), {});
  // assertEquals(testPattern("/foo/(\\d+)", "/foo/11231"), {});
  // assertEquals(testPattern("/foo/(bar)", "/foo/bar"), {});
  // assertEquals(testPattern("/a/:b/:c*", "/a/b/c"), { b: "b", c: "c" });
  assertEquals(testPattern("/a/:b/:c*", "/a/b"), { b: "b" });
  assertEquals(testPattern("/foo/:path*", "/foo/bar/asdf"), {
    path: "bar/asdf",
  });
  assertEquals(testPattern("/movies/:foo@:bar", "/movies/asdf@hehe"), {
    foo: "asdf",
    bar: "hehe",
  });
  assertEquals(
    testPattern(
      "{/:lang(fr|es|pt-BR)}?/cs2-server-status",
      "/fr/cs2-server-status",
    ),
    {
      lang: "fr",
    },
  );
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
