import { collect } from "../src/dev/mod.ts";
import { assert, dirname, fromFileUrl, join } from "./deps.ts";

Deno.test({
  name: "routes collect",
  fn: async () => {
    const { routes } = await collect(
      join(dirname(fromFileUrl(import.meta.url)), "fixture"),
    );

    assert(
      !routes.includes("routes/not_found.test.ts") &&
        !routes.includes("routes\\not_found.test.ts"),
    );
    assert(
      !routes.includes("routes/_404_test.tsx") &&
        !routes.includes("routes\\_404_test.tsx"),
    );
    assert(
      !routes.includes("routes/islands/test_test.tsx") &&
        !routes.includes("routes\\islands\\test_test.tsx"),
    );
  },
});

Deno.test({
  name: "routes collect with custom pattern",
  fn: async () => {
    const { routes } = await collect(
      join(
        dirname(fromFileUrl(import.meta.url)),
        "fixture_router_ignore_files",
      ),
      /[\.|_]cy\.[t|j]s(x)?$/,
    );

    assert(
      !routes.includes("routes/index.cy.ts") &&
        !routes.includes("routes\\index.cy.ts"),
    );
    assert(
      routes.includes("routes/index.tsx") ||
        routes.includes("routes\\index.tsx"),
    );
  },
});
