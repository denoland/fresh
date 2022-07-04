import { assert } from "../../tests/deps.ts";
import { middlewarePathToPattern, selectMiddlewares } from "./context.ts";
import { MiddlewareRoute } from "./types.ts";

Deno.test("selectMiddlewares", () => {
  const url = "https://fresh.deno.dev/api/abc/def";
  const middlewaresPath = [
    // should select
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
});
