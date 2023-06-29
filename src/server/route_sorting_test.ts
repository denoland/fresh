import { assertEquals } from "../../tests/deps.ts";
import { sortMiddleware, sortRoutes } from "./context.ts";

Deno.test("sort middleware", () => {
  const routes = [
    { pattern: "{/*}?" },
    { pattern: "/layeredMdw{/*}?" },
    { pattern: "/layeredMdw/layer2{/*}?" },
    { pattern: "/layeredMdw/layer2/layer3{/*}?" },
    { pattern: "/layeredMdw/nesting/:tenant/:environment{/*}?" },
    { pattern: "/layeredMdw/nesting/:tenant{/*}?" },
    { pattern: "/layeredMdw/nesting{/*}?" },
    { pattern: "/state-in-props{/*}?" },
  ];
  const sortedRoutes = [
    { pattern: "{/*}?" },
    { pattern: "/layeredMdw{/*}?" },
    { pattern: "/state-in-props{/*}?" },
    { pattern: "/layeredMdw/layer2{/*}?" },
    { pattern: "/layeredMdw/nesting{/*}?" },
    { pattern: "/layeredMdw/layer2/layer3{/*}?" },
    { pattern: "/layeredMdw/nesting/:tenant{/*}?" },
    { pattern: "/layeredMdw/nesting/:tenant/:environment{/*}?" },
  ];
  sortMiddleware(routes);
  assertEquals(routes, sortedRoutes);
});

Deno.test("sort routes", () => {
  const routes = [
    { pattern: "/:name" },
    { pattern: "/api/get_only" },
    { pattern: "/api/head_override" },
    { pattern: "/assetsCaching" },
    { pattern: "/books/:id(\\d+)" },
    { pattern: "/connInfo" },
    { pattern: "/evil" },
    { pattern: "/failure" },
    { pattern: "/" },
    { pattern: "/intercept" },
    { pattern: "/intercept_args" },
    { pattern: "/islands" },
    { pattern: "/islands/returning_null" },
    { pattern: "/islands/root_fragment" },
    { pattern: "/islands/root_fragment_conditional_first" },
    { pattern: "/layeredMdw/layer2-no-mw/without_mw" },
    { pattern: "/layeredMdw/layer2/abc" },
    { pattern: "/layeredMdw/layer2" },
    { pattern: "/layeredMdw/layer2/layer3/:id" },
    { pattern: "/layeredMdw/nesting/:tenant/:environment/:id" },
    { pattern: "/layeredMdw/nesting/:tenant" },
    { pattern: "/layeredMdw/nesting" },
    { pattern: "/middleware_root" },
    { pattern: "/not_found" },
    { pattern: "/params/:path*" },
    { pattern: "/props/:id" },
    { pattern: "/static" },
    { pattern: "/status_overwrite" },
    { pattern: "/foo/:path*" },
  ];
  const sortedRoutes = [
    { pattern: "/api/get_only" },
    { pattern: "/api/head_override" },
    { pattern: "/assetsCaching" },
    { pattern: "/books/:id(\\d+)" },
    { pattern: "/connInfo" },
    { pattern: "/evil" },
    { pattern: "/failure" },
    { pattern: "/" },
    { pattern: "/intercept" },
    { pattern: "/intercept_args" },
    { pattern: "/islands" },
    { pattern: "/islands/returning_null" },
    { pattern: "/islands/root_fragment" },
    { pattern: "/islands/root_fragment_conditional_first" },
    { pattern: "/layeredMdw/layer2-no-mw/without_mw" },
    { pattern: "/layeredMdw/layer2" },
    { pattern: "/layeredMdw/layer2/abc" },
    { pattern: "/layeredMdw/layer2/layer3/:id" },
    { pattern: "/layeredMdw/nesting" },
    { pattern: "/layeredMdw/nesting/:tenant" },
    { pattern: "/layeredMdw/nesting/:tenant/:environment/:id" },
    { pattern: "/middleware_root" },
    { pattern: "/not_found" },
    { pattern: "/params/:path*" },
    { pattern: "/props/:id" },
    { pattern: "/static" },
    { pattern: "/status_overwrite" },
    { pattern: "/foo/:path*" },
    { pattern: "/:name" },
  ];
  sortRoutes(routes);
  assertEquals(routes, sortedRoutes);
});
