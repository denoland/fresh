import { assertSpyCalls, existsSync, spy } from "./deps.ts";
import {
  AppModule,
  ErrorPageModule,
  Route,
  StaticFile,
  UnknownPageModule,
} from "$fresh/src/server/types.ts";
import { knownMethods } from "$fresh/src/server/router.ts";
import { Plugin } from "$fresh/src/server/mod.ts";

export type CheckFunction = () => CheckResult[];

export enum CheckCategory {
  ModuleExport = "Module Export",
  MultipleModules = "Multiple Modules",
  DuplicateRoutePatterns = "Duplicate Route Patterns",
  HandlerOrComponent = "Handler or Component",
  StaticDirectory = "Static Directory",
  StaticFileConflict = "Static File Conflict",
  PluginRender = "Plugin Render",
  PluginRenderAsync = "Plugin RenderAsync",
  PluginInjectModules = "Plugin Inject Modules",
}

export type CheckResult = {
  category: CheckCategory;
  message: string;
  link?: string;
};

/** Asserts that the module has a default export */
export function assertModuleExportsDefault(
  module: {
    url: string;
    module: AppModule | UnknownPageModule | ErrorPageModule;
  } | null,
  moduleName: string,
): CheckResult[] {
  const results: CheckResult[] = [];

  if (module && !module.module.default) {
    results.push({
      category: CheckCategory.ModuleExport,
      message: `Your ${moduleName} file does not have a default export.`,
      link: module.url,
    });
  }

  return results;
}

/** Asserts that only one module exists with the given name. */
export function assertSingleModule(
  routes: Route[],
  moduleName: string,
): CheckResult[] {
  const results: CheckResult[] = [];
  const moduleRoutes = routes.filter((route) =>
    route.name.split("/").pop() === moduleName
  );

  if (moduleRoutes.length > 0) {
    results.push({
      category: CheckCategory.MultipleModules,
      message:
        `Only one ${moduleName} is allowed per application. It must be in the root of the /routes/ folder.`,
      link: moduleRoutes[0].url,
    });
  }
  return results;
}

/** Asserts that each route has a unique pattern. */
export function assertSingleRoutePattern(routes: Route[]) {
  const results: CheckResult[] = [];
  const routeNames = new Set(routes.map((route) => route.pattern));

  routes.forEach((route) => {
    if (routeNames.has(route.pattern)) {
      routeNames.delete(route.pattern);
    } else {
      results.push({
        category: CheckCategory.DuplicateRoutePatterns,
        message:
          `Duplicate route pattern: ${route.pattern}. Please rename the route to resolve the route conflicts.`,
        link: route.url,
      });
    }
  });

  return results;
}

/** Asserts that each route has at least one handler or component. */
export function assertRoutesHaveHandlerOrComponent(
  routes: Route[],
): CheckResult[] {
  const results: CheckResult[] = [];

  routes.forEach((route) => {
    const hasComponent = !!route.component;
    let hasHandlerMethod = typeof route.handler === "function";

    if (typeof route.handler === "object") {
      for (const method of knownMethods) {
        if (method in route.handler) {
          hasHandlerMethod = true;
          break;
        }
      }
    }

    if (!hasComponent && !hasHandlerMethod) {
      results.push({
        category: CheckCategory.HandlerOrComponent,
        message:
          `Route at ${route.name} must have a handler or component. It's possible you're missing a default export.`,
        link: route.url,
      });
    }
  });

  return results;
}

/** Asserts that the usage of the `staticDir` option is safe. */
export function assertStaticDirSafety(
  dir: string,
  defaultDir: string,
): CheckResult[] {
  const results: CheckResult[] = [];

  if (dir === defaultDir) {
    results.push({
      category: CheckCategory.StaticDirectory,
      message:
        `You cannot use the default static directory as a static override. Please choose a different directory.`,
    });
  }

  if (dir && existsSync(defaultDir)) {
    results.push({
      category: CheckCategory.StaticDirectory,
      message:
        `You cannot have both a static override and a default static directory. Please remove the default static directory.`,
      link: defaultDir,
    });
  }

  return results;
}

/** Asserts that here are no route conflicts with static files. */
export function assertNoStaticRouteConflicts(
  routes: Route[],
  staticFiles: StaticFile[],
): CheckResult[] {
  const results: CheckResult[] = [];
  const routePatterns = new Set(routes.map((route) => route.pattern));

  staticFiles.forEach((staticFile) => {
    if (routePatterns.has(staticFile.path)) {
      results.push({
        category: CheckCategory.StaticFileConflict,
        message:
          `Static file conflict: A file exists at ${staticFile.path} which matches a route pattern. Please rename the file or change the route pattern.`,
        link: staticFile.localUrl.pathname,
      });
    }
  });

  return results;
}

/** Asserts that each plugin, which uses `plugin.render`, calls `ctx.render()` once. */
export function assertPluginsCallRender(plugins: Plugin[]): CheckResult[] {
  const results: CheckResult[] = [];

  plugins.forEach((plugin) => {
    if (typeof plugin.render === "function") {
      const renderSpy = spy(() => ({
        htmlText: "",
        requiresHydration: false,
      }));
      plugin.render({ render: renderSpy });
      try {
        assertSpyCalls(renderSpy, 1);
      } catch {
        results.push({
          category: CheckCategory.PluginRender,
          message: `Plugin ${plugin.name} must call ctx.render() exactly once.`,
        });
      }
    }
  });

  return results;
}

/** Asserts that each plugin, which uses `plugin.renderAsync`, calls `ctx.renderAsync()` once. */
export function assertPluginsCallRenderAsync(
  plugins: Plugin[],
): CheckResult[] {
  const results: CheckResult[] = [];

  for (const plugin of plugins) {
    if (typeof plugin.renderAsync === "function") {
      try {
        const renderAsyncSpy = spy(() => {
          return Promise.resolve({
            htmlText: "",
            requiresHydration: false,
          });
        });

        // Call empty `.then()` to wait for `ctx.renderAsync()` to resolve
        plugin.renderAsync({ renderAsync: renderAsyncSpy }).then();
        assertSpyCalls(renderAsyncSpy, 1);
      } catch {
        results.push({
          category: CheckCategory.PluginRenderAsync,
          message:
            `Plugin ${plugin.name} must call ctx.renderAsync() exactly once.`,
        });
      }
    }
  }

  return results;
}

/** Asserts that each plugin, which injects scripts, injects modules. */
export function assertPluginsInjectModules(plugins: Plugin[]): CheckResult[] {
  const results: CheckResult[] = [];

  plugins.forEach((plugin) => {
    Object.values(plugin.entrypoints ?? {}).forEach((script) => {
      try {
        const url = new URL(script);
        const file = Deno.readTextFileSync(url);

        if (!file.includes("export default")) {
          results.push({
            category: CheckCategory.PluginInjectModules,
            message:
              `Plugin ${plugin.name} must export a default function from its entrypoint.`,
          });
        }
      } catch (_err) {
        if (!script.includes("export default")) {
          results.push({
            category: CheckCategory.PluginInjectModules,
            message:
              `Plugin ${plugin.name} must export a default function from its entrypoint.`,
          });
        }
      }
    });
  });

  return results;
}
