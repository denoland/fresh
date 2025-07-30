import { expect } from "@std/expect";
import { escapeScript, pathToExportName, pathToSpec } from "./utils.ts";

Deno.test("filenameToExportName", () => {
  expect(pathToExportName("/islands/foo.tsx")).toBe("foo");
  expect(pathToExportName("/islands/foo.v2.tsx")).toBe("foo_v2");
  expect(pathToExportName("/islands/nav-bar.tsx")).toBe("nav_bar");
  expect(pathToExportName("/islands/_.$bar.tsx")).toBe("_$bar");
  expect(pathToExportName("/islands/1.hello.tsx")).toBe("_hello");
  expect(pathToExportName("/islands/collapse...repeat_-dash.tsx")).toBe(
    "collapse_repeat_dash",
  );
});

Deno.test("escapeScriptContent - closing </script> + </style>", () => {
  expect(
    escapeScript(
      "foo</script>bar</style>baz</script>foobar",
    ),
  ).toEqual(
    "foo<\\/script>bar<\\/style>baz<\\/script>foobar",
  );
  expect(
    escapeScript(
      "foo</ScRIpT>bar</StYLe>baz</SCRIPT>foobar",
    ),
  ).toEqual(
    "foo<\\/ScRIpT>bar<\\/StYLe>baz<\\/SCRIPT>foobar",
  );
});

Deno.test("escapeScript - legacy <!--", () => {
  expect(escapeScript("<!--<script>")).toEqual("\\x3C!--<script>");
  expect(escapeScript("<!--</script>")).toEqual("\\x3C!--<\\/script>");
});

Deno.test("escapeScript - script combined", () => {
  expect(escapeScript(`// This is a comment containing <!--
let foo = x <!--y; // That's valid JS operators
const s = "This is a string containing <!--";`)).toEqual(
    `// This is a comment containing \\x3C!--
let foo = x \\x3C!--y; // That's valid JS operators
const s = "This is a string containing \\x3C!--";`,
  );
});

Deno.test("escapeScript - json", () => {
  expect(escapeScript("<!--<script>", { json: true })).toEqual(
    "\\u003C!--<script>",
  );
  expect(escapeScript("<!--</ScRIpt>", { json: true })).toEqual(
    "\\u003C!--<\\/ScRIpt>",
  );
});

Deno.test("pathToSpec", () => {
  expect(pathToSpec("/foo", "/foo/bar")).toEqual("./bar");
  expect(pathToSpec("/", "C:\\foo\\bar")).toEqual("/foo/bar");
  expect(pathToSpec("/", "\\\\foo//bar")).toEqual("/foo/bar");
  expect(pathToSpec("/foo", "bar")).toEqual("./bar");
  expect(pathToSpec("/foo/bar", "/foo/baz")).toEqual("../baz");
  expect(pathToSpec("/foo", "file:///foo//bar")).toEqual("./bar");
  expect(pathToSpec("/foo", "http://example.com")).toEqual(
    "http://example.com",
  );
  expect(pathToSpec("/foo", "https://example.com")).toEqual(
    "https://example.com",
  );
  expect(pathToSpec("/foo", "jsr:@foo/bar")).toEqual("jsr:@foo/bar");
});
