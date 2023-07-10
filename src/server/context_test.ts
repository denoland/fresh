import { assert, assertEquals } from "../../tests/deps.ts";
import {
  middlewarePathToPattern,
  routeWarnings,
  selectMiddlewares,
} from "./context.ts";
import { MiddlewareRoute, Route } from "./types.ts";

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

Deno.test({
  name: "dynamic route conflicts",
  fn() {
    const routes = [
      { name: "control-index", pattern: "/control" },
      { name: "control-normal_route", pattern: "/control/normal_route" },
      {
        name: "two_dynamic-[second_dynamic]",
        pattern: "/two_dynamic/:second_dynamic",
      },
      { name: "two_dynamic-[dynamic]", pattern: "/two_dynamic/:dynamic" },
      { name: "override-[dynamic]", pattern: "/override/:dynamic" },
      { name: "override-override", pattern: "/override/:path*" },
    ] as Route[];
    const expected = [
      `Potential route conflict. The following dynamic routes may conflict:\n  /two_dynamic/:second_dynamic\n  /two_dynamic/:dynamic\n`,
      `Potential route conflict. The following dynamic routes may conflict:\n  /override/:dynamic\n  /override/:path*\n`,
    ];
    const output = routeWarnings(routes);
    assertEquals(output, expected);
  },
});
