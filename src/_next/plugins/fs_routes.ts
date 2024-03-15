import { AnyComponent } from "preact";
import { App } from "../app.ts";
import { WalkEntry } from "jsr:@std/fs/walk";
import * as path from "jsr:@std/path";
import { FreshContext, RouteConfig } from "$fresh/src/server/mod.ts";
import { RouteHandler } from "../defines.ts";
import { compose, Middleware } from "../middlewares/compose.ts";
import { renderMiddleware } from "../middlewares/render/render_middleware.ts";
import { Method, pathToPattern, sortRoutePaths } from "../router.ts";
import { HandlerFn, isHandlerMethod } from "$fresh/src/_next/defines.ts";
import { FsAdapter, fsAdapter } from "$fresh/src/_next/fs.ts";

const TEST_FILE_PATTERN = /[._]test\.(?:[tj]sx?|[mc][tj]s)$/;

interface InternalRoute<T> {
  path: string;
  base: string;
  filePath: string;
  config: RouteConfig | null;
  handlers: RouteHandler<unknown, T> | null;
  component: AnyComponent<FreshContext<T>> | null;
}

export interface FreshFsItem<T = unknown> {
  config?: RouteConfig;
  handler?: RouteHandler<unknown, T>;
  handlers?: RouteHandler<unknown, T>;
  default?: AnyComponent<FreshContext<T>>;
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

  const routeModules: InternalRoute<T>[] = await Promise.all(
    relRoutePaths.map(async (routePath) => {
      const mod = await options.load(routePath);
      if (!isFreshFile(mod)) {
        throw new Error(
          `Expected a route, middleware, layout or error template, but couldn't find relevant exports in: ${routePath}`,
        );
      }

      const handlers = mod.handlers ?? mod.handler ?? null;
      if (typeof handlers === "function" && handlers.length > 1) {
        throw new Error(
          `Handlers must only have one argument but found more than one. Check the function signature in: ${
            path.join(routesDir, routePath)
          }`,
        );
      }

      const normalizedPath = `/${
        routePath.slice(0, routePath.lastIndexOf("."))
      }`;
      const base = normalizedPath.slice(0, normalizedPath.lastIndexOf("/"));
      return {
        path: normalizedPath,
        filePath: routePath,
        base,
        handlers: mod.handlers ?? mod.handler ?? null,
        config: mod.config ?? null,
        component: mod.default ?? null,
      } as InternalRoute<T>;
    }),
  );

  routeModules.sort((a, b) => sortRoutePaths(a.path, b.path));

  const stack: InternalRoute<T>[] = [];
  for (let i = 0; i < routeModules.length; i++) {
    const routeMod = routeModules[i];
    const normalized = routeMod.path;

    // Remove any elements not matching our parent path anymore
    let j = stack.length - 1;
    while (j >= 0 && !routeMod.path.startsWith(stack[j].base + "/")) {
      j--;
      stack.pop();
    }

    if (normalized.endsWith("/_app")) {
      stack.push(routeMod);
    } else if (normalized.endsWith("/_middleware")) {
      stack.push(routeMod);
    } else if (normalized.endsWith("/_layout")) {
      stack.push(routeMod);
    } else if (normalized.endsWith("/_error")) {
      // FIXME
    } else {
      // const localStack = getRouteStack(stack, routeMod);
      const localStack = stack;
      // console.log(localStack);

      const middlewares: Middleware<T>[] = [];
      const components: AnyComponent<FreshContext<T>>[] = [];

      // Prepare component tree if the current route has a component
      for (let j = 0; j < localStack.length; j++) {
        const m = localStack[j];
        if (routeMod.component !== null && m.component !== null) {
          // deno-lint-ignore no-explicit-any
          components.push(m.component as any);
        }

        // FIXME: Make file extension agnostic
        if (
          m.handlers !== null && !isHandlerMethod(m.handlers) &&
          (m.path.endsWith("/_middleware") ||
            m.path.endsWith("/_middleware"))
        ) {
          // FIXME: Decide what to do with Middleware vs Handler type
          middlewares.push(m.handlers as Middleware<T>);
        }
      }

      if (routeMod.component !== null) {
        components.push(routeMod.component);
      }

      const routePath = routeMod.config?.routeOverride ??
        pathToPattern(normalized.slice(1));

      const handlers = routeMod.handlers;
      if (
        handlers === null ||
        (isHandlerMethod(handlers) && Object.keys(handlers).length === 0)
      ) {
        const mid = addRenderHandler(components, middlewares, undefined);
        app.get(routePath, mid);
      } else if (isHandlerMethod(handlers)) {
        for (const method of Object.keys(handlers) as Method[]) {
          const fn = handlers[method];

          if (fn !== undefined) {
            const mid = addRenderHandler(components, middlewares, fn);
            const lower = method.toLowerCase() as Lowercase<Method>;
            app[lower](routePath, mid);
          }
        }
      } else if (typeof handlers === "function") {
        const mid = addRenderHandler(components, middlewares, handlers);
        app.all(routePath, renderMiddleware(components, mid));
      }
    }
  }
}

function getRouteStack<T>(
  stack: InternalRoute<T>[],
  current: InternalRoute<T>,
): InternalRoute<T>[] {
  let skipApp = !!current.config?.skipAppWrapper;
  let skipLayoutIdx = current.config?.skipInheritedLayouts
    ? stack.length - 1
    : -1;

  console.log("start", skipLayoutIdx, skipApp);

  let i = stack.length - 1;
  while (i--) {
    if (!current.path.startsWith(stack[i].base + "/")) {
      stack.pop();
      continue;
    }

    const config = stack[i].config;
    if (config) {
      if (!skipApp && skipLayoutIdx > -1 && config.skipAppWrapper) {
        skipApp = true;
      }
      if (i > skipLayoutIdx && config.skipInheritedLayouts) {
        skipLayoutIdx = i;
      }
    }

    if (skipApp && skipLayoutIdx >= 0) {
      break;
    }
  }

  let outStack = stack;
  if (stack.length > 0) {
    const first = stack[0].path;
    const hasApp = first === "/_app.tsx" || first === "/_app.jsx" ||
      first === "/_app.ts" || first === "/_app.js";
    console.log("MUTATE", {
      hasApp,
      skipApp,
      skipLayoutIdx,
    });

    if (skipLayoutIdx > -1) {
      if (skipApp && hasApp) {
        outStack = stack.slice(skipLayoutIdx - 1);
      } else if (!skipApp && hasApp) {
        console.log(stack.length, skipLayoutIdx, stack);
        outStack = stack.slice(skipLayoutIdx);
        outStack[0] = stack[0];
        console.log("================================");
        console.log(outStack);
      } else if (skipLayoutIdx === 0) {
        outStack = [];
      } else {
        outStack = stack.slice(skipLayoutIdx);
      }
    } else if (skipApp && hasApp) {
      outStack = stack.slice(1);
    }
  }

  return outStack;
}

function addRenderHandler<T>(
  components: AnyComponent<FreshContext<T>>[],
  middlewares: Middleware<T>[],
  handler: HandlerFn<unknown, T> | undefined,
): Middleware<T> {
  let mid = renderMiddleware<T>(components, handler);
  if (middlewares.length > 0) {
    const chain = middlewares.slice();
    chain.push(mid);
    mid = compose(chain);
  }

  return mid;
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
