import type { AnyComponent } from "preact";
import type { App } from "../../app.ts";
import type { WalkEntry } from "@std/fs/walk";
import * as path from "@std/path";
import type { RouteConfig } from "../../types.ts";
import type { RouteHandler } from "../../handlers.ts";
import type { MiddlewareFn } from "../../middlewares/mod.ts";
import type { AsyncAnyComponent } from "../../render.ts";
import { pathToPattern } from "../../router.ts";
import { type HandlerFn, isHandlerByMethod } from "../../handlers.ts";
import { type FsAdapter, fsAdapter } from "../../fs.ts";
import { parseRootPath } from "../../config.ts";
import type { PageProps } from "../../render.ts";

const TEST_FILE_PATTERN = /[._]test\.(?:[tj]sx?|[mc][tj]s)$/;
const GROUP_REG = /(^|[/\\\\])\((_[^/\\\\]+)\)[/\\\\]/;

interface InternalRoute<State> {
  path: string;
  base: string;
  filePath: string;
  config: RouteConfig | null;
  handlers:
    | MiddlewareFn<State>[]
    | RouteHandler<unknown, State>
    | null;
  component: AnyComponent<PageProps<unknown, State>> | null;
}

export interface FreshFsItem<State> {
  config?: RouteConfig;
  handler?: RouteHandler<unknown, State> | HandlerFn<unknown, State>[];
  handlers?: RouteHandler<unknown, State>;
  default?:
    | AnyComponent<PageProps<unknown, State>>
    | AsyncAnyComponent<PageProps<unknown, State>>;
}

// deno-lint-ignore no-explicit-any
function isFreshFile<State>(mod: any): mod is FreshFsItem<State> {
  return mod !== null && typeof mod === "object" &&
      typeof mod.default === "function" ||
    typeof mod.config === "object" || typeof mod.handlers === "object" ||
    typeof mod.handlers === "function" || typeof mod.handler === "object" ||
    typeof mod.handler === "function";
}

export interface FsRoutesOptions {
  /**
   * Parent directory for the `/routes` and `/islands` folders.
   *
   * By default, the `root` config option of the provided app is used.
   * @default app.config.root
   */
  dir?: string;
  ignoreFilePattern?: RegExp[];
  loadRoute: (path: string) => Promise<unknown>;
  loadIsland: (path: string) => Promise<unknown>;
}

export interface TESTING_ONLY__FsRoutesOptions {
  _fs?: FsAdapter;
}

export async function fsRoutes<State>(
  app: App<State>,
  options_: FsRoutesOptions,
) {
  const options = options_ as FsRoutesOptions & TESTING_ONLY__FsRoutesOptions;
  const ignore = options.ignoreFilePattern ?? [TEST_FILE_PATTERN];
  const fs = options._fs ?? fsAdapter;

  const dir = options.dir
    ? parseRootPath(options.dir, fs.cwd())
    : app.config.root;
  const islandDir = path.join(dir, "islands");
  const routesDir = path.join(dir, "routes");

  const islandPaths: string[] = [];
  const relRoutePaths: string[] = [];

  // Walk routes folder
  await Promise.all([
    walkDir(
      islandDir,
      (entry) => {
        islandPaths.push(entry.path);
      },
      ignore,
      fs,
    ),
    walkDir(
      routesDir,
      (entry) => {
        const relative = path.relative(routesDir, entry.path);

        // A `(_islands)` path segment is a local island folder.
        // Any route path segment wrapped in `(_...)` is ignored
        // during route collection.
        const match = relative.match(GROUP_REG);
        if (match && match[2][0] === "_") {
          if (match[2] === "_islands") {
            islandPaths.push(entry.path);
          }
          return;
        }

        const url = new URL(relative, "http://localhost/");
        relRoutePaths.push(url.pathname.slice(1));
      },
      ignore,
      fs,
    ),
  ]);

  await Promise.all(islandPaths.map(async (islandPath) => {
    const relative = path.relative(islandDir, islandPath);
    // deno-lint-ignore no-explicit-any
    const mod = await options.loadIsland(relative) as any;
    for (const key of Object.keys(mod)) {
      const maybeFn = mod[key];
      if (typeof maybeFn === "function") {
        app.island(islandPath, key, maybeFn);
      }
    }
  }));

  const routeModules: InternalRoute<State>[] = await Promise.all(
    relRoutePaths.map(async (routePath) => {
      const mod = await options.loadRoute(routePath);
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
      const isMiddleware = normalizedPath.endsWith("/_middleware");
      return {
        path: normalizedPath,
        filePath: routePath,
        base,
        handlers: mod.handlers ?? mod.handler ??
          (isMiddleware ? mod.default ?? null : null),
        config: mod.config ?? null,
        component: isMiddleware ? null : mod.default ?? null,
      } as InternalRoute<State>;
    }),
  );

  routeModules.sort((a, b) => sortRoutePaths(a.path, b.path));
  const errorPaths = new Set<string>();

  for (let i = 0; i < routeModules.length; i++) {
    const routeMod = routeModules[i];
    const normalized = routeMod.path;

    if (normalized.endsWith("/_app")) {
      const component = routeMod.component;
      if (component !== null) {
        app.appWrapper(component);
      }
      continue;
    } else if (normalized.endsWith("/_middleware")) {
      if (routeMod.handlers === null) continue;

      if (isHandlerByMethod(routeMod.handlers)) {
        warnInvalidRoute(
          "Middleware does not support object handlers with GET, POST, etc.",
        );
        continue;
      }
      const pattern = pathToPattern(
        normalized.slice(1, -"/_middleware".length),
        { keepGroups: true },
      );

      const handlers = (Array.isArray(routeMod.handlers)
        ? routeMod.handlers
        : [routeMod.handlers]) as MiddlewareFn<State>[];

      app.use(pattern, ...handlers);

      continue;
    } else if (normalized.endsWith("/_layout")) {
      if (routeMod.handlers !== null) {
        warnInvalidRoute("Layout does not support handlers");
      }

      const pattern = pathToPattern(normalized.slice(1, -"/_layout".length), {
        keepGroups: true,
      });
      const { component, config } = routeMod;
      if (component !== null) {
        app.layout(pattern, component, config ?? undefined);
      }
      continue;
    } else if (normalized.endsWith("/_error")) {
      const pattern = pathToPattern(normalized.slice(1, -"/_error".length), {
        keepGroups: true,
      });
      errorPaths.add(pattern);
      app.onError(pattern, {
        config: routeMod.config ?? undefined,
        component: routeMod.component ?? undefined,
        // deno-lint-ignore no-explicit-any
        handler: routeMod.handlers as any ?? undefined,
      });
      continue;
    } else if (normalized.endsWith("/_404")) {
      app.notFound({
        config: routeMod.config ?? undefined,
        component: routeMod.component ?? undefined,
        // deno-lint-ignore no-explicit-any
        handler: routeMod.handlers as any ?? undefined,
      });
      continue;
    } else if (normalized.endsWith("/_500")) {
      const pattern = pathToPattern(normalized.slice(1, -"/_500".length), {
        keepGroups: true,
      });
      if (errorPaths.has(pattern)) continue;

      app.onError(pattern, {
        config: routeMod.config ?? undefined,
        component: routeMod.component ?? undefined,
        // deno-lint-ignore no-explicit-any
        handler: routeMod.handlers as any ?? undefined,
      });
      continue;
    }

    let pattern = pathToPattern(normalized.slice(1), { keepGroups: true });
    if (normalized.endsWith("/index")) {
      if (!pattern.endsWith("/")) {
        pattern += "/";
      }
    }

    const routePattern = pathToPattern(normalized.slice(1));

    app.route(pattern, {
      config: {
        ...routeMod.config ?? undefined,
        routeOverride: routeMod.config?.routeOverride ?? routePattern,
      },
      component: routeMod.component ?? undefined,
      // deno-lint-ignore no-explicit-any
      handler: routeMod.handlers as any ?? undefined,
    });
  }
}

function warnInvalidRoute(message: string) {
  // deno-lint-ignore no-console
  console.warn(
    `🍋 %c[WARNING] Unsupported route config: ${message}`,
    "color:rgb(251, 184, 0)",
  );
}

async function walkDir(
  dir: string,
  callback: (entry: WalkEntry) => void,
  ignore: RegExp[],
  fs: FsAdapter,
) {
  if (!await fs.isDirectory(dir)) return;

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

const APP_REG = /_app(?!\.[tj]sx?)?$/;

/**
 * Sort route paths where special Fresh files like `_app`,
 * `_layout` and `_middleware` are sorted in front.
 */
export function sortRoutePaths(a: string, b: string) {
  // The `_app` route should always be the first
  if (APP_REG.test(a)) return -1;
  else if (APP_REG.test(b)) return 1;

  const aLen = a.length;
  const bLen = b.length;

  let segment = false;
  let aIdx = 0;
  let bIdx = 0;
  for (; aIdx < aLen && bIdx < bLen; aIdx++, bIdx++) {
    const charA = a.charAt(aIdx);
    const charB = b.charAt(bIdx);

    // When comparing a grouped route with a non-grouped one, we
    // need to skip over the group name to effectively compare the
    // actual route.
    if (charA === "(" && charB !== "(") {
      if (charB == "[") return -1;
      return 1;
    } else if (charB === "(" && charA !== "(") {
      if (charA == "[") return 1;
      return -1;
    }

    if (charA === "/" || charB === "/") {
      segment = true;

      // If the other path doesn't close the segment
      // then we don't need to continue
      if (charA !== "/") return 1;
      if (charB !== "/") return -1;

      continue;
    }

    if (segment) {
      segment = false;

      const scoreA = getRoutePathScore(charA, a, aIdx);
      const scoreB = getRoutePathScore(charB, b, bIdx);
      if (scoreA === scoreB) {
        if (charA !== charB) {
          // TODO: Do we need localeSort here or is this good enough?
          return charA < charB ? 0 : 1;
        }
        continue;
      }

      return scoreA > scoreB ? -1 : 1;
    }

    if (charA !== charB) {
      // TODO: Do we need localeSort here or is this good enough?
      return charA < charB ? 0 : 1;
    }

    // If we're at the end of A or B, then we assume that the longer
    // path is more specific
    if (aIdx === aLen - 1 && bIdx < bLen - 1) {
      return 1;
    } else if (bIdx === bLen - 1 && aIdx < aLen - 1) {
      return -1;
    }
  }

  return 0;
}

/**
 * Assign a score based on the first two characters of a path segment.
 * The goal is to sort `_middleware` and `_layout` in front of everything
 * and `[` or `[...` last respectively.
 */
function getRoutePathScore(char: string, s: string, i: number): number {
  if (char === "_") {
    if (i + 1 < s.length) {
      if (s[i + 1] === "e") return 4;
      if (s[i + 1] === "m") return 6;
    }
    return 5;
  } else if (char === "[") {
    if (i + 1 < s.length && s[i + 1] === ".") {
      return 0;
    }
    return 1;
  }

  if (
    i + 4 === s.length - 1 && char === "i" && s[i + 1] === "n" &&
    s[i + 2] === "d" && s[i + 3] === "e" && s[i + 4] === "x"
  ) {
    return 3;
  }

  return 2;
}
