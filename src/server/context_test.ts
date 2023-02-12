import { assert, assertEquals } from "../../tests/deps.ts";
import { middlewarePathToPattern, selectMiddlewares } from "./context.ts";
import { MiddlewareRoute } from "./types.ts";

Deno.test("selectMiddlewares", () => {
  const url = "https://fresh.deno.dev/api/level1/level2/end";
  const middlewaresPath = [
    // should select. (Middleware passed to 'selectMiddlewares' should
    // already be sorted from the root to the deepest)
    "_middleware",
    "api/_middleware",
    "api/[id]/_middleware",
    "api/[id]/[path]/_middleware",

    // should not select
    "api/xyz/_middleware",
    "api/[id]/xyz/_middleware",
    "api/[id]/[path]/foo/_middleware",
  ];
  const mwRoutes = middlewaresPath.map((path) =>
    middlewarePathToPattern(path)
  ) as MiddlewareRoute[];
  const mws = selectMiddlewares(url, mwRoutes);
  assert(mws.length === 4);

  assertEquals(mws[0].middlewareParams, {});
  assertEquals(mws[1].middlewareParams, {});
  assertEquals(mws[2].middlewareParams, {
    id: "level1",
  });
  assertEquals(mws[3].middlewareParams, {
    id: "level1",
    path: "level2",
  });
});
