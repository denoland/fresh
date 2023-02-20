import { collect } from "../src/dev/mod.ts";
import { assert, dirname, fromFileUrl, join } from "./deps.ts";

Deno.test({
  name: "routes collect",
  fn: async () => {
    const { routes } = await collect(
      join(dirname(fromFileUrl(import.meta.url)), "fixture"),
    );

    assert(!routes.includes("/not_found.test.ts"));
    assert(!routes.includes("/_404_test.tsx"));
    assert(!routes.includes("/islands/test_test.tsx"));
  },
});
