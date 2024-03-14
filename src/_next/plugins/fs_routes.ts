import { AnyComponent, h } from "preact";
import { FreshApp } from "../app.ts";
import { walk, WalkEntry } from "jsr:@std/fs/walk";
import * as path from "jsr:@std/path";
import { RouteConfig } from "$fresh/src/server/mod.ts";
import { renderMiddleware } from "../middlewares/render/render_middleware.ts";

const TEST_FILE_PATTERN = /[._]test\.(?:[tj]sx?|[mc][tj]s)$/;

interface InternalRoute {
  path: string;
  config: RouteConfig | null;
  handlers: any;
  component: AnyComponent | null;
}

export interface FreshFsItem {
  config?: RouteConfig;
  handler?: any;
  handlers?: any;
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
  ignoreFilePatter?: RegExp[];
  load: (path: string) => Promise<unknown>;
}

export async function fsRoutes<T>(app: FreshApp<T>, options: FsRoutesOptions) {
  const ignore = options.ignoreFilePatter ?? [TEST_FILE_PATTERN];

  const islandDir = path.join(options.dir, "islands");
  const routesDir = path.join(options.dir, "routes");

  const relIslandsPaths: string[] = [];
  const relRoutePaths: string[] = [];

  // Walk routes folder
  await Promise.all([
    walkDir(islandDir, (entry) => {
      // FIXME
      // console.log("islands", entry);
    }, ignore),
    walkDir(routesDir, (entry) => {
      // FIXME: Route groups
      const relative = path.relative(routesDir, entry.path);
      relRoutePaths.push(relative);
    }, ignore),
  ]);

  relIslandsPaths.sort();
  relRoutePaths.sort();

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
      // Prepare component tree if the current route has a component
      if (routeMod.component !== null) {
        const components: AnyComponent[] = [];
        for (let i = 0; i < stack.length; i++) {
          const comp = stack[i].component;
          if (comp !== null) {
            components.push(comp);
          }
        }
        components.push(routeMod.component);

        const routePath = "/" +
          (normalized.endsWith("index") ? normalized.slice(0, -5) : normalized);

        // FIXME: Methods
        app.get(routePath, renderMiddleware(components));
      }
    }
  }
}

async function walkDir(
  dir: string,
  callback: (entry: WalkEntry) => void,
  ignore: RegExp[],
) {
  try {
    const stat = await Deno.stat(dir);
    if (!stat.isDirectory) return;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return;
    throw err;
  }

  const entries = walk(dir, {
    includeDirs: false,
    includeFiles: true,
    exts: ["tsx", "jsx", "ts", "js"],
    skip: ignore,
  });

  for await (const entry of entries) {
    callback(entry);
  }
}
