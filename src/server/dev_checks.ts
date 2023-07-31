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

interface CheckResult {
  category: string;
  message: string;
  fileLink?: string;
}

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

export function assertSingleModule(
  routes: Route[],
  moduleName: string,
): CheckResult[] {
  const moduleRoutes = routes.filter((route) =>
    route.name.includes(moduleName)
  );

  if (moduleRoutes.length > 0) {
    return [{
      category: "Multiple Modules",
      message:
        `Only one ${moduleName} is allowed per application. It must be in the root of the /routes/ folder.`,
    }];
  }
  return [];
}

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

export function assertRoutesHaveHandlerOrComponent(
  routes: Route[],
): CheckResult[] {
  return routes.flatMap((route) => {
    const hasComponent = !!route.component;

    let hasHandlerMethod = false;
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

  if (existsSync(defaultDir)) {
    results.push({
      category: "Static Directory",
      message:
        "You cannot have both a static override and a default static directory. Please remove the default static directory.",
    });
  }

  return results;
}

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

export function assertPluginsCallRenderAsync(
  plugins: Plugin[],
): CheckResult[] {
  const results: CheckResult[] = [];

  for (const plugin of plugins) {
    if (typeof plugin.renderAsync === "function") {
      const renderAsyncSpy = spy(() =>
        Promise.resolve({
          htmlText: "",
          requiresHydration: false,
        })
      );
      plugin.renderAsync({ renderAsync: renderAsyncSpy }).then(
        () => {
          try {
            assertSpyCalls(renderAsyncSpy, 1);
          } catch {
            results.push({
              category: "Plugin RenderAsync",
              message:
                `Plugin '${plugin.name}' must call ctx.render() exactly once.`,
            });
          }
        },
      );
    }
  }

  return results;
}

export function assertPluginsInjectModules(plugins: Plugin[]): CheckResult[] {
  const results: CheckResult[] = [];

  plugins.forEach((plugin) => {
    Object.values(plugin.entrypoints ?? {}).forEach((script) => {
      if (!script.includes("export default")) {
        results.push({
          category: "Plugin Inject Modules",
          message:
            `Plugin '${plugin.name}' must export a default function from its entrypoint.`,
        });
      }
    });
  });

  return results;
}

export function assertNoDynamicRouteConflicts(routes: Route[]) {
  type RouteMap = Record<string, { dynamic: Route[] }>;
  const isDynamicRoute = (route: Route) =>
    /:\w+/.test(route.pattern) && !route.name.startsWith("islands");

  const routesByDir = routes.reduce((routeMap: RouteMap, route) => {
    const dir = route.pattern.split("/").slice(0, -1).join("/");
    if (!routeMap[dir]) routeMap[dir] = { dynamic: [] };
    if (isDynamicRoute(route)) {
      routeMap[dir].dynamic.push(route);
    }
    return routeMap;
  }, {});

  const conflicts = Object.values(routesByDir).reduce(
    (acc: string[], map) => {
      if (map.dynamic.length > 1) {
        const conflictingRoutes = map.dynamic.map((route) =>
          `  ${route.pattern}`
        ).join("\n");
        const message =
          `Potential route conflict. The following dynamic routes may conflict:\n${conflictingRoutes}\n`;
        acc.push(message);
      }
      return acc;
    },
    [],
  );

  return conflicts.flatMap((x) => ({
    category: "Dynamic Route Conflict",
    message: x,
  } as CheckResult));
}
