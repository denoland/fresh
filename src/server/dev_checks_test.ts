import { assertEquals } from "$std/testing/asserts.ts";
import { Fragment, h } from "preact";
import { toBaseRoute } from "./context.ts";
import {
  assertModuleExportsDefault,
  assertNoStaticRouteConflicts,
  assertPluginsCallRender,
  assertPluginsCallRenderAsync,
  assertPluginsInjectModules,
  assertRoutesHaveHandlerOrComponent,
  assertSingleModule,
  assertSingleRoutePattern,
  assertStaticDirSafety,
  type CheckResult,
} from "./dev_checks.ts";
import type { AppModule, Plugin, Route, StaticFile } from "./types.ts";

function createRoute(route: Partial<Route>): Route {
  return {
    baseRoute: toBaseRoute("/"),
    name: "/",
    url: "/",
    pattern: "/",
    component: () => h(Fragment, null, []),
    handler: () => new Response(),
    csp: false,
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
    const result = assertModuleExportsDefault(app, "_app");
    assertEquals(result, []);
  });

  await t.step("fails validation check", () => {
    const app: AppModule = { default: undefined } as unknown as AppModule;
    const expected: CheckResult[] = [
      {
        category: "Module Export",
        message: "Your _app file does not have a default export.",
        fileLink: "_app",
      },
    ];
    const result = assertModuleExportsDefault(app, "_app");
    assertEquals(result, expected);
  });
});

Deno.test("assertSingleModule", async (t) => {
  await t.step("passes validation check", () => {
    const routes: Route[] = [createRoute({ name: "_app" })];
    const expected: CheckResult[] = [];
    const result = assertSingleModule(routes, "_app");
    assertEquals(result, expected);
  });

  await t.step("fails validation check", () => {
    const routes: Route[] = [
      createRoute({ name: "_app" }),
      createRoute({ name: "_app" }),
    ];
    const expected: CheckResult[] = [
      {
        category: "Multiple Modules",
        message:
          "Only one _app is allowed per application. It must be in the root of the /routes/ folder.",
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
      createRoute({ pattern: "/foo" }),
      createRoute({ pattern: "/foo" }),
      createRoute({ pattern: "/:bar" }),
      createRoute({ pattern: "/:bar" }),
    ];
    const expected: CheckResult[] = [
      {
        category: "Duplicate Route Patterns",
        message:
          "Duplicate route pattern: /foo. Please rename the route to resolve the route conflicts.",
      },
      {
        category: "Duplicate Route Patterns",
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
        handler: { GET: () => new Response() },
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
        category: "Handler or Component",
        fileLink: "/foo",
        message:
          `Route at /foo must have a handler or component. It's possible you're missing a default export.`,
      },
      {
        category: "Handler or Component",
        fileLink: "/bar",
        message:
          `Route at /bar must have a handler or component. It's possible you're missing a default export.`,
      },
    ];
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
        category: "Static Directory",
        message:
          "You cannot use the default static directory as a static override. Please choose a different directory.",
      },
    ];
    const result = assertStaticDirSafety("./static", "./static");
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
        category: "Static File Conflict",
        fileLink: "/foo.bar",
        message:
          "Static file conflict: A file exists at '/foo.bar' which matches a route pattern. Please rename the file or change the route pattern.",
      },
    ];
    const result = assertNoStaticRouteConflicts(routes, files);
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
        category: "Plugin Render",
        message: "Plugin 'foo' must call ctx.render() exactly once.",
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
          return Promise.resolve({});
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
          await Promise.resolve();
          return {};
        },
      },
    ];
    const expected: CheckResult[] = [
      {
        category: "Plugin RenderAsync",
        message: "Plugin 'foo' must call ctx.renderAsync() exactly once.",
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
        category: "Plugin Inject Modules",
        message:
          "Plugin 'foo' must export a default function from its entrypoint.",
      },
    ];
    const result = assertPluginsInjectModules(plugins);
    assertEquals(result, expected);
  });
});
