import { AnyComponent } from "preact";
import { App } from "../app.ts";
import { WalkEntry } from "jsr:@std/fs/walk";
import * as path from "jsr:@std/path";
import { RouteConfig } from "$fresh/src/server/mod.ts";
import { RouteHandler } from "../defines.ts";
import { renderMiddleware } from "../middlewares/render/render_middleware.ts";
import { Method, pathToPattern, sortRoutePaths } from "../router.ts";
import { isHandlerMethod } from "$fresh/src/_next/defines.ts";
import { FsAdapter, fsAdapter } from "$fresh/src/_next/fs.ts";

const TEST_FILE_PATTERN = /[._]test\.(?:[tj]sx?|[mc][tj]s)$/;

interface InternalRoute {
  path: string;
  config: RouteConfig | null;
  handlers: RouteHandler<unknown, unknown> | null;
  component: AnyComponent | null;
}

export interface FreshFsItem {
  config?: RouteConfig;
  handler?: RouteHandler<unknown, unknown>;
  handlers?: RouteHandler<unknown, unknown>;
  default?: AnyComponent;
}

// deno-lint-ignore no-explicit-any
function isFreshFile(mod: any): mod is FreshFsItem {
  return mod !== null && typeof mod === "object" &&
      typeof mod.default === "function" ||
    typeof mod.config === "object" || typeof mod.handlers === "object" ||
    typeof mod.handlers === "function" || typeof mod.handler === "object" ||
    typeof mod.handler === "function";
}

export interface FsRoutesOptions {
  dir: string;
  ignoreFilePattern?: RegExp[];
  load: (path: string) => Promise<unknown>;
  /**
   * Only used for testing.
   */
  _fs?: FsAdapter;
}

export async function fsRoutes<T>(app: App<T>, options: FsRoutesOptions) {
  const ignore = options.ignoreFilePattern ?? [TEST_FILE_PATTERN];
  const fs = options._fs ?? fsAdapter;

  const islandDir = path.join(options.dir, "islands");
  const routesDir = path.join(options.dir, "routes");

  const relIslandsPaths: string[] = [];
  const relRoutePaths: string[] = [];

  // Walk routes folder
  await Promise.all([
    walkDir(
      islandDir,
      (entry) => {
        // FIXME
        // console.log("islands", entry);
      },
      ignore,
      fs,
    ),
    walkDir(
      routesDir,
      (entry) => {
        // FIXME: Route groups
        const relative = path.relative(routesDir, entry.path);
        relRoutePaths.push(relative);
      },
      ignore,
      fs,
    ),
  ]);

  relIslandsPaths.sort();

  const routeModules: InternalRoute[] = await Promise.all(
    relRoutePaths.map(async (routePath) => {
      const mod = await options.load(routePath);
      if (!isFreshFile(mod)) {
        throw new Error(
          `Expected a route, middleware, layout or error template, but couldn't find relevant exports in: ${routePath}`,
        );
      }

      return {
        path: routePath,
        handlers: mod.handlers ?? mod.handler ?? null,
        config: mod.config ?? null,
        component: mod.default ?? null,
      };
    }),
  );

  routeModules.sort((a, b) => sortRoutePaths(a.path, b.path));

  const stack: InternalRoute[] = [];
  for (let i = 0; i < routeModules.length; i++) {
    const routeMod = routeModules[i];
    const normalized = routeMod.path.slice(0, routeMod.path.lastIndexOf("."));

    if (normalized === "_app") {
      stack.push(routeMod);
    } else if (normalized === "_middleware") {
      stack.push(routeMod);
    } else if (normalized === "_layout") {
      stack.push(routeMod);
    } else if (normalized === "_error") {
      // FIXME
    } else {
      const components: AnyComponent[] = [];
      // Prepare component tree if the current route has a component
      if (routeMod.component !== null) {
        for (let i = 0; i < stack.length; i++) {
          const comp = stack[i].component;
          if (comp !== null) {
            components.push(comp);
          }
        }
        components.push(routeMod.component);
      }

      const routePath = routeMod.config?.routeOverride ??
        pathToPattern(normalized);

      const handlers = routeMod.handlers;
      if (handlers === null) {
        app.get(routePath, renderMiddleware(components, undefined));
      } else if (isHandlerMethod(handlers)) {
        for (const method of Object.keys(handlers) as Method[]) {
          const fn = handlers[method];
          if (fn !== undefined) {
            const lower = method.toLowerCase() as Lowercase<Method>;
            app[lower](
              routePath,
              renderMiddleware(components, fn),
            );
          }
        }
      } else if (typeof handlers === "function") {
        app.all(routePath, renderMiddleware(components, handlers));
      }
    }
  }
}

async function walkDir(
  dir: string,
  callback: (entry: WalkEntry) => void,
  ignore: RegExp[],
  fs: FsAdapter,
) {
  if (!fs.isDirectory(dir)) return;

  const entries = fs.walk(dir, {
    includeDirs: false,
    includeFiles: true,
    exts: ["tsx", "jsx", "ts", "js"],
    skip: ignore,
  });

  for await (const entry of entries) {
    callback(entry);
  }
}
