import { expect } from "@std/expect";
import {
  AppRouter,
  findOrCreateSegment,
  pathToSegments,
  patternToRegex,
  type RouteMatch,
} from "./router2.ts";
import type { Method } from "./router.ts";

Deno.test("pathToSegments", () => {
  expect(pathToSegments("/")).toEqual([""]);
  expect(pathToSegments("/foo")).toEqual(["", "foo"]);
  expect(pathToSegments("/foo/bar")).toEqual(["", "foo", "bar"]);

  expect(pathToSegments("/:foo")).toEqual(["", ":foo"]);
  expect(pathToSegments("/:foo/:bar")).toEqual(["", ":foo", ":bar"]);
  expect(pathToSegments("/:foo-:bar")).toEqual(["", ":foo-:bar"]);
});

Deno.test("findOrCreateSegment - root", () => {
  const router = new AppRouter();
  const found = findOrCreateSegment(router, "");
  expect(found).toEqual(router.root);
});

Deno.test("findOrCreateSegment - /foo/bar", () => {
  const router = new AppRouter();
  const found = findOrCreateSegment(router, "/foo/bar");
  expect(found).toEqual(router.root.children.get("foo")?.children.get("bar"));
});

Deno.test("findOrCreateSegment - /:foo/bar/:baz", () => {
  const router = new AppRouter();
  const found = findOrCreateSegment(router, "/:foo/bar/:baz");
  expect(found).toEqual(
    router.root.children.get(":foo")?.children.get("bar")?.children.get(":baz"),
  );
});

Deno.test("patternToRegex", () => {
  expect(patternToRegex("/")).toEqual(new RegExp(/\//));
  expect(patternToRegex("/foo/bar")).toEqual(new RegExp(/\/foo\/bar/));

  expect(patternToRegex("/:foo")).toEqual(new RegExp(/\/(?<foo>)/));
  expect(patternToRegex("/:foo-:bar")).toEqual(
    new RegExp(/\/(?<foo>)-(?<bar>)/),
  );
  expect(patternToRegex("/:foo/:bar")).toEqual(
    new RegExp(/\/(?<foo>)\/(?<bar>)/),
  );
  // TODO: Check this
  expect(patternToRegex("/foo/([^\\/]+?)")).toEqual(
    new RegExp(/\/foo\/([^\/]+?)/),
  );

  // URLPattern https://github.com/web-platform-tests/wpt/blob/b82c55238d71bf589cc0ea49df72463dcd6bedcd/urlpattern/resources/urlpatterntestdata.json
  // https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API#pattern_syntax

  // TODO: Ignore regex starting ^
  // TODO: Ignore regex end $
  // TODO: Lookahead + negative lookahead + lookbehind + negative lookbehind not supported
  // TODO: Parenthesis need to be escaped
  // TODO: Group modifiers: ? + *
  // TODO: Group delimiters: {}
  // TODO: Automatic group prefixing
  // TODO: Wildcard *
  // TODO: Pattern normalization
});

async function testRouter<State>(
  router: AppRouter<State>,
  method: Method,
  pathname: string,
  result: Omit<RouteMatch<State>, "fn">,
): Promise<void> {
  router.finalize();

  const url = new URL(pathname, "https://localhost/");
  const match = router.match(method, url);
  expect({ ...match, fn: null }).toEqual({
    ...result,
    fn: null,
  });

  const mockCtx = {
    next() {
      return new Response(null, { status: 418 });
    },
  };

  const res = (!match.fn)
    ? mockCtx.next() // deno-lint-ignore no-explicit-any
    : await match.fn(mockCtx as any);

  await res.body?.cancel();
}

Deno.test("AppRouter - no match with no routes, but call middlewares", async () => {
  const logs: string[] = [];
  const router = new AppRouter()
    .use("", (ctx) => {
      logs.push("mid1");
      return ctx.next();
    });

  await testRouter(router, "GET", "/", {
    methodMatch: false,
    patternMatch: false,
    pattern: null,
    params: Object.create(null),
  });

  expect(logs).toEqual(["mid1"]);
});

Deno.test("AppRouter - matches /", async () => {
  const logs: string[] = [];
  const router = new AppRouter()
    .use("", (ctx) => {
      logs.push("mid1");
      return ctx.next();
    })
    .route("/", {});

  await testRouter(router, "GET", "/", {
    methodMatch: false,
    patternMatch: true,
    pattern: null,
    params: Object.create(null),
  });

  expect(logs).toEqual(["mid1"]);
});
