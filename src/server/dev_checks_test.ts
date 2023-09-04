import { assertEquals } from "$std/testing/asserts.ts";
import { Fragment, h } from "preact";
import { toBaseRoute } from "./context.ts";
import {
  assertModuleExportsDefault,
  assertNoDynamicRouteConflicts,
  assertNoStaticRouteConflicts,
  assertPluginsCallRender,
  assertPluginsCallRenderAsync,
  assertPluginsInjectModules,
  assertRoutesHaveHandlerOrComponent,
  assertSingleModule,
  assertSingleRoutePattern,
  assertStaticDirSafety,
  CheckCategory,
  type CheckResult,
} from "./dev_checks.ts";
import type { AppModule, Plugin, Route, StaticFile } from "./types.ts";

function createRoute(route: Partial<Route>): Route {
  return {
    appWrapper: false,
    baseRoute: toBaseRoute("/"),
    component: () => h(Fragment, null, []),
    csp: false,
    handler: () => new Response(),
    inheritLayouts: false,
    name: "/",
    pattern: "/",
    url: "/",
    ...route,
  };
}

function createStaticFile(file: Partial<StaticFile>): StaticFile {
  return {
    localUrl: new URL("http://localhost:3000/foo.bar"),
    path: "/foo.bar",
    size: 0,
    contentType: "text/plain",
    etag: "foo",
    ...file,
  };
}

Deno.test("assertModuleExportsDefault", async (t) => {
  await t.step("passes validation check", () => {
    const app: AppModule = { default: () => h(Fragment, null, []) };
    const result = assertModuleExportsDefault(
      { url: "_app.tsx", module: app },
      "_app",
    );
    assertEquals(result, []);
  });

  await t.step("fails validation check", () => {
    const app: AppModule = { default: undefined } as unknown as AppModule;
    const expected: CheckResult[] = [
      {
        category: CheckCategory.ModuleExport,
        message: `Your _app file does not have a default export.`,
        link: "_app.tsx",
      },
    ];
    const result = assertModuleExportsDefault(
      { url: "_app.tsx", module: app },
      "_app",
    );
    assertEquals(result, expected);
  });
});

Deno.test("assertSingleModule", async (t) => {
  await t.step("passes validation check", () => {
    const routes: Route[] = [];
    const expected: CheckResult[] = [];
    const result = assertSingleModule(routes, "_app");
    assertEquals(result, expected);
  });

  await t.step("passes validation check w/ given module in route name", () => {
    const routes: Route[] = [
      createRoute({ name: "/foo/_app/bar" }),
      createRoute({ name: "/foo/bar_app" }),
    ];
    const expected: CheckResult[] = [];
    const result = assertSingleModule(routes, "_app");
    assertEquals(result, expected);
  });

  await t.step("fails validation check", () => {
    const routes: Route[] = [
      createRoute({ name: "/foo/bar/_app" }),
    ];
    const expected: CheckResult[] = [
      {
        category: CheckCategory.MultipleModules,
        message:
          "Only one _app is allowed per application. It must be in the root of the /routes/ folder.",
        link: "/",
      },
    ];
    const result = assertSingleModule(routes, "_app");
    assertEquals(result, expected);
  });
});

Deno.test("assertSingleRoutePattern", async (t) => {
  await t.step("passes validation check", () => {
    const routes: Route[] = [
      createRoute({ pattern: "/foo" }),
      createRoute({ pattern: "/bar" }),
    ];
    const expected: CheckResult[] = [];
    const result = assertSingleRoutePattern(routes);
    assertEquals(result, expected);
  });

  await t.step("fails validation check", () => {
    const routes: Route[] = [
      createRoute({ pattern: "/foo", url: "/foo" }),
      createRoute({ pattern: "/foo", url: "/foo" }),
      createRoute({ pattern: "/:bar", url: "/:bar" }),
      createRoute({ pattern: "/:bar", url: "/:bar" }),
    ];
    const expected: CheckResult[] = [
      {
        category: CheckCategory.DuplicateRoutePatterns,
        link: "/foo",
        message:
          "Duplicate route pattern: /foo. Please rename the route to resolve the route conflicts.",
      },
      {
        category: CheckCategory.DuplicateRoutePatterns,
        link: "/:bar",
        message:
          "Duplicate route pattern: /:bar. Please rename the route to resolve the route conflicts.",
      },
    ];
    const result = assertSingleRoutePattern(routes);
    assertEquals(result, expected);
  });
});

Deno.test("assertRoutesHaveHandlerOrComponent", async (t) => {
  await t.step("passes validation check", () => {
    const routes = [
      createRoute({
        component: () => h(Fragment, null, []),
        handler: undefined,
        name: "/foo",
        url: "/foo",
      }),
      createRoute({
        component: undefined,
        handler: () => new Response(),
        name: "/bar",
        url: "/bar",
      }),
      createRoute({
        component: undefined,
        handler: { GET: () => new Response() },
        name: "/baz",
        url: "/baz",
      }),
      createRoute({
        component: () => h(Fragment, null, []),
        handler: { GET: () => new Response(), POST: () => new Response() },
        name: "/qux",
        url: "/qux",
      }),
    ] as Route[];

    const expected: CheckResult[] = [];
    const result = assertRoutesHaveHandlerOrComponent(
      routes,
    );
    assertEquals(result, expected);
  });

  await t.step("fails validation check", () => {
    const routes: Route[] = [
      createRoute({
        component: undefined,
        handler: undefined,
        name: "/foo",
        url: "/foo",
      }),
      createRoute({
        component: undefined,
        handler: {},
        name: "/bar",
        url: "/bar",
      }),
    ];
    const result = assertRoutesHaveHandlerOrComponent(
      routes,
    );
    const expected: CheckResult[] = [
      {
        category: CheckCategory.HandlerOrComponent,
        link: "/foo",
        message:
          `Route at /foo must have a handler or component. It's possible you're missing a default export.`,
      },
      {
        category: CheckCategory.HandlerOrComponent,
        link: "/bar",
        message:
          `Route at /bar must have a handler or component. It's possible you're missing a default export.`,
      },
    ];
    assertEquals(result, expected);
  });
});

Deno.test("assertNoDynamicRouteConflicts", async (t) => {
  await t.step("passes validation check", () => {
    const routes: Route[] = [
      createRoute({ pattern: "/foo/:baz", url: "/foo/:baz" }),
      createRoute({ pattern: "/bar/:baz", url: "/bar/:baz" }),
      createRoute({ pattern: "/foo/:bar/baz", url: "/foo/:bar/baz" }),
      createRoute({ pattern: "/foo/bar/:baz", url: "/foo/bar/:baz" }),
      createRoute({ pattern: "/bar/:baz/qux", url: "/bar/:baz/qux" }),
      createRoute({ pattern: "/baz/:qux*", url: "/baz/:qux*" }),
      createRoute({ pattern: "/baz", url: "/baz" }),
    ];
    const expected: CheckResult[] = [];
    const result = assertNoDynamicRouteConflicts(routes);
    assertEquals(result, expected);
  });

  await t.step("fails validation check", () => {
    const routes: Route[] = [
      createRoute({ pattern: "/foo/:bar", url: "/foo/:bar" }),
      createRoute({ pattern: "/baz/:qux*", url: "/baz/:qux*" }),
      createRoute({ pattern: "/baz/:qux", url: "/baz/:qux" }),
      createRoute({ pattern: "/foo/:baz", url: "/foo/:baz" }),
    ];
    const expected: CheckResult[] = [
      {
        category: CheckCategory.DynamicRouteConflict,
        message:
          "Potential route conflict: /foo/:bar and /foo/:baz may conflict.",
        link: "/foo/:bar",
      },
      {
        category: CheckCategory.DynamicRouteConflict,
        message:
          "Potential route conflict: /baz/:qux* and /baz/:qux may conflict.",
        link: "/baz/:qux*",
      },
    ];
    const result = assertNoDynamicRouteConflicts(routes);
    assertEquals(result, expected);
  });
});

Deno.test("assertNoStaticRouteConflict", async (t) => {
  await t.step("passes validation check", () => {
    const routes: Route[] = [
      createRoute({ pattern: "/foo" }),
    ];
    const files: StaticFile[] = [
      createStaticFile({ path: "/bar" }),
    ];
    const expected: CheckResult[] = [];
    const result = assertNoStaticRouteConflicts(routes, files);
    assertEquals(result, expected);
  });

  await t.step("fails validation check", () => {
    const routes: Route[] = [
      createRoute({ pattern: "/foo.bar" }),
    ];
    const files: StaticFile[] = [
      createStaticFile({ path: "/foo.bar" }),
    ];
    const expected: CheckResult[] = [
      {
        category: CheckCategory.StaticFileConflict,
        link: "http://localhost:3000/foo.bar",
        message:
          "Static file conflict: A file exists at /foo.bar which matches a route pattern. Please rename the file or change the route pattern.",
      },
    ];
    const result = assertNoStaticRouteConflicts(routes, files);
    assertEquals(result, expected);
  });
});

Deno.test("assertStaticDirSafety", async (t) => {
  await t.step("passes validation check", () => {
    const expected: CheckResult[] = [];
    const result = assertStaticDirSafety("./foo", "./static");
    assertEquals(result, expected);
  });

  await t.step("passes validation check w/ falsy values", () => {
    const expected: CheckResult[] = [];
    const result = assertStaticDirSafety("", "./static");
    assertEquals(result, expected);
  });

  await t.step("fails validation check", () => {
    const expected: CheckResult[] = [
      {
        category: CheckCategory.StaticDirectory,
        message:
          "You cannot use the default static directory as a static override. Please choose a different directory.",
      },
    ];
    const result = assertStaticDirSafety("./static", "./static");
    assertEquals(result, expected);
  });
});

Deno.test("assertPluginsCallRender", async (t) => {
  await t.step("passes validation check", () => {
    const plugins: Plugin[] = [
      {
        name: "foo",
        render: (ctx) => {
          ctx.render();
          return {};
        },
      },
    ];
    const expected: CheckResult[] = [];
    const result = assertPluginsCallRender(plugins);
    assertEquals(result, expected);
  });

  await t.step("fails validation check", () => {
    const plugins: Plugin[] = [
      {
        name: "foo",
        render: (_ctx) => ({}),
      },
    ];
    const expected: CheckResult[] = [
      {
        category: CheckCategory.PluginRender,
        message: "Plugin foo must call ctx.render() exactly once.",
      },
    ];
    const result = assertPluginsCallRender(plugins);
    assertEquals(result, expected);
  });
});

Deno.test("assertPluginsCallRenderAsync", async (t) => {
  await t.step("passes validation check", () => {
    const plugins: Plugin[] = [
      {
        name: "foo",
        renderAsync: async (ctx) => {
          await ctx.renderAsync();
          return await Promise.resolve({});
        },
      },
    ];
    const expected: CheckResult[] = [];
    const result = assertPluginsCallRenderAsync(plugins);
    assertEquals(result, expected);
  });

  await t.step("fails validation check", () => {
    const plugins: Plugin[] = [
      {
        name: "foo",
        renderAsync: async (_ctx) => {
          return await Promise.resolve({});
        },
      },
    ];
    const expected: CheckResult[] = [
      {
        category: CheckCategory.PluginRenderAsync,
        message: "Plugin foo must call ctx.renderAsync() exactly once.",
      },
    ];
    const result = assertPluginsCallRenderAsync(plugins);
    assertEquals(result, expected);
  });
});

Deno.test("assertPluginsInjectModules", async (t) => {
  await t.step("passes validation check", () => {
    const plugins: Plugin[] = [
      {
        name: "foo",
        entrypoints: {
          main: "export default function() {}",
        },
      },
    ];
    const expected: CheckResult[] = [];
    const result = assertPluginsInjectModules(plugins);
    assertEquals(result, expected);
  });

  await t.step("fails validation check", () => {
    const plugins: Plugin[] = [
      {
        name: "foo",
        entrypoints: {
          main: "function() {}",
        },
      },
    ];
    const expected: CheckResult[] = [
      {
        category: CheckCategory.PluginInjectModules,
        message:
          "Plugin foo must export a default function from its entrypoint.",
      },
    ];
    const result = assertPluginsInjectModules(plugins);
    assertEquals(result, expected);
  });
});
