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

export type CheckResult = {
  category: string;
  message: string;
  fileLink?: string;
};

/** Asserts that the module has a default export */
export function assertModuleExportsDefault(
  module: AppModule | UnknownPageModule | ErrorPageModule | null,
  moduleName: string,
): CheckResult[] {
  if (module && !module.default) {
    return [{
      category: "Module Export",
      message: `Your ${moduleName} file does not have a default export.`,
      fileLink: moduleName,
    }];
  }
  return [];
}

/** Asserts that only one module exists with the given name. */
export function assertSingleModule(
  routes: Route[],
  moduleName: string,
): CheckResult[] {
  const moduleRoutes = routes.filter((route) =>
    route.name.includes(moduleName)
  );

  if (moduleRoutes.length > 1) {
    return [{
      category: "Multiple Modules",
      message:
        `Only one ${moduleName} is allowed per application. It must be in the root of the /routes/ folder.`,
    }];
  }
  return [];
}

/** Asserts that each route has a unique pattern. */
export function assertSingleRoutePattern(routes: Route[]) {
  const routeNames = new Set(routes.map((route) => route.pattern));

  return routes.flatMap((route) => {
    if (routeNames.has(route.pattern)) {
      routeNames.delete(route.pattern);
    } else {
      return [{
        category: "Duplicate Route Patterns",
        message:
          `Duplicate route pattern: ${route.pattern}. Please rename the route to resolve the route conflicts.`,
      }];
    }
    return [];
  });
}

/** Asserts that each route has at least one handler or component. */
export function assertRoutesHaveHandlerOrComponent(
  routes: Route[],
): CheckResult[] {
  return routes.flatMap((route) => {
    const hasComponent = !!route.component;
    let hasHandlerMethod = false;

    if (typeof route.handler === "function") {
      hasHandlerMethod = true;
    }

    if (typeof route.handler === "object") {
      for (const method of knownMethods) {
        if (method in route.handler) {
          hasHandlerMethod = true;
          break;
        }
      }
    }

    if (!hasComponent && !hasHandlerMethod) {
      return [{
        category: "Handler or Component",
        message:
          `Route at ${route.url} must have a handler or component. It's possible you're missing a default export.`,
        fileLink: route.name,
      }];
    }
    return [];
  });
}

/** Asserts that the usage of the `staticDir` option is safe. */
export function assertStaticDirSafety(
  dir: string,
  defaultDir: string,
): CheckResult[] {
  const results: CheckResult[] = [];

  if (dir === defaultDir) {
    results.push({
      category: "Static Directory",
      message:
        "You cannot use the default static directory as a static override. Please choose a different directory.",
    });
  }

  if (dir && existsSync(defaultDir)) {
    results.push({
      category: "Static Directory",
      message:
        "You cannot have both a static override and a default static directory. Please remove the default static directory.",
    });
  }

  return results;
}

/** Asserts that here are no route conflicts with static files. */
export function assertNoStaticRouteConflicts(
  routes: Route[],
  staticFiles: StaticFile[],
): CheckResult[] {
  const routePatterns = new Set(routes.map((route) => route.pattern));

  return staticFiles.flatMap((staticFile) => {
    if (routePatterns.has(staticFile.path)) {
      return [{
        category: "Static File Conflict",
        message:
          `Static file conflict: A file exists at '${staticFile.path}' which matches a route pattern. Please rename the file or change the route pattern.`,
        fileLink: staticFile.path,
      }];
    }
    return [];
  });
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
          category: "Plugin Render",
          message:
            `Plugin '${plugin.name}' must call ctx.render() exactly once.`,
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

        plugin.renderAsync({ renderAsync: renderAsyncSpy }).then(() => {});
        assertSpyCalls(renderAsyncSpy, 1);
      } catch {
        results.push({
          category: "Plugin RenderAsync",
          message:
            `Plugin '${plugin.name}' must call ctx.renderAsync() exactly once.`,
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
            category: "Plugin Inject Modules",
            message:
              `Plugin '${plugin.name}' must export a default function from its entrypoint.`,
          });
        }
      } catch (_err) {
        if (!script.includes("export default")) {
          results.push({
            category: "Plugin Inject Modules",
            message:
              `Plugin '${plugin.name}' must export a default function from its entrypoint.`,
          });
        }
      }
    });
  });

  return results;
}
