import { assert, assertEquals } from "../../tests/deps.ts";
import {
  middlewarePathToPattern,
  sanitizeIslandName,
  selectMiddlewares,
} from "./context.ts";
import { MiddlewareRoute } from "./types.ts";

Deno.test("sanitizeIslandName", () => {
  assertEquals(
    sanitizeIslandName("gallery"),
    "Gallery",
  );
  assertEquals(
    sanitizeIslandName("component-gallery"),
    "ComponentGallery",
  );
  assertEquals(
    sanitizeIslandName("gallery/ComponentGallery"),
    "Gallery_ComponentGallery",
  );
  assertEquals(
    sanitizeIslandName("/gallery/ComponentGallery"),
    "Gallery_ComponentGallery",
  );
  assertEquals(
    sanitizeIslandName("gallery/ComponentGallery/test"),
    "Gallery_ComponentGallery_Test",
  );
  assertEquals(
    sanitizeIslandName("/gallery/ComponentGallery/test"),
    "Gallery_ComponentGallery_Test",
  );
});

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
