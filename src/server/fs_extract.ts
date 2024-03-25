import { ComponentType, h } from "preact";
import {
  AppModule,
  ErrorPage,
  ErrorPageModule,
  InternalFreshState,
  Island,
  IslandModule,
  LayoutModule,
  LayoutRoute,
  MiddlewareHandler,
  MiddlewareModule,
  MiddlewareRoute,
  Plugin,
  Route,
  RouteModule,
  StaticFile,
  UnknownPage,
  UnknownPageModule,
} from "./types.ts";
import * as router from "./router.ts";
import DefaultErrorHandler from "./default_error_page.tsx";
import {
  basename,
  contentType,
  dirname,
  extname,
  join,
  SEPARATOR,
  toFileUrl,
  walk,
} from "./deps.ts";
import { BUILD_ID } from "./build_id.ts";
import { toBaseRoute } from "./compose.ts";
import { stringToIdentifier } from "./init_safe_deps.ts";

export const ROOT_BASE_ROUTE = toBaseRoute("/");

const DEFAULT_APP: AppModule = {
  default: ({ Component }: { Component: ComponentType }) => h(Component, {}),
};

const DEFAULT_NOT_FOUND: UnknownPage = {
  baseRoute: toBaseRoute("/"),
  pattern: "",
  url: "",
  name: "_404",
  handler: (req) => router.defaultOtherHandler(req),
  csp: false,
  appWrapper: true,
  inheritLayouts: true,
};

const DEFAULT_ERROR: ErrorPage = {
  baseRoute: toBaseRoute("/"),
  pattern: "",
  url: "",
  name: "_500",
  component: DefaultErrorHandler,
  handler: (_req, ctx) => ctx.render(),
  csp: false,
  appWrapper: true,
  inheritLayouts: true,
};

export interface FsExtractResult {
  app: AppModule;
  layouts: LayoutRoute[];
  notFound: UnknownPage;
  error: ErrorPage;
  middlewares: MiddlewareRoute[];
  islands: Island[];
  routes: Route[];
  staticFiles: StaticFile[];
}

/**
 * Extract all routes, and prepare them into the `Page` structure.
 */
export async function extractRoutes(
  state: InternalFreshState,
): Promise<FsExtractResult> {
  const { config, manifest } = state;

  // Get the manifest' base URL.
  const baseUrl = new URL("./", manifest.baseUrl).href;

  const routes: Route[] = [];
  const islands: Island[] = [];
  const middlewares: MiddlewareRoute[] = [];
  let app: AppModule = DEFAULT_APP;
  const layouts: LayoutRoute[] = [];
  let notFound: UnknownPage = DEFAULT_NOT_FOUND;
  let error: ErrorPage = DEFAULT_ERROR;
  const allRoutes = [
    ...Object.entries(manifest.routes),
    ...(config.plugins ? getMiddlewareRoutesFromPlugins(config.plugins) : []),
    ...(config.plugins ? getRoutesFromPlugins(config.plugins) : []),
  ];

  // Presort all routes so that we only need to sort once
  allRoutes.sort((a, b) => sortRoutePaths(a[0], b[0]));

  for (
    const [self, module] of allRoutes
  ) {
    const url = new URL(self, baseUrl).href;
    if (!url.startsWith(baseUrl + "routes")) {
      throw new TypeError("Page is not a child of the basepath.");
    }
    const path = url.substring(baseUrl.length + "routes".length);
    let baseRoute = path.substring(1, path.length - extname(path).length);
    baseRoute = join(state.config.basePath.slice(1), baseRoute).replaceAll(
      SEPARATOR,
      "/",
    );
    const name = baseRoute.replace(/\//g, "-");
    const isLayout = path.endsWith("/_layout.tsx") ||
      path.endsWith("/_layout.ts") || path.endsWith("/_layout.jsx") ||
      path.endsWith("/_layout.js");
    const isMiddleware = path.endsWith("/_middleware.tsx") ||
      path.endsWith("/_middleware.ts") || path.endsWith("/_middleware.jsx") ||
      path.endsWith("/_middleware.js");
    if (
      !path.startsWith("/_") && !isLayout && !isMiddleware
    ) {
      const { default: component, config } = module as RouteModule;
      let pattern = pathToPattern(baseRoute);
      if (config?.routeOverride) {
        pattern = String(config.routeOverride);
      }
      let { handler } = module as RouteModule;
      if (!handler && "handlers" in module) {
        throw new Error(
          `Found named export "handlers" in ${self} instead of "handler". Did you mean "handler"?`,
        );
      }
      handler ??= {};
      if (
        component && typeof handler === "object" && handler.GET === undefined
      ) {
        handler.GET = (_req, { render }) => render();
      }
      if (
        typeof handler === "object" && handler.GET !== undefined &&
        handler.HEAD === undefined
      ) {
        const GET = handler.GET;
        handler.HEAD = async (req, ctx) => {
          const resp = await GET(req, ctx);
          resp.body?.cancel();
          return new Response(null, {
            headers: resp.headers,
            status: resp.status,
            statusText: resp.statusText,
          });
        };
      }
      const route: Route = {
        baseRoute: toBaseRoute(baseRoute),
        pattern,
        url,
        name,
        component,
        handler,
        csp: Boolean(config?.csp ?? false),
        appWrapper: !config?.skipAppWrapper,
        inheritLayouts: !config?.skipInheritedLayouts,
      };
      routes.push(route);
    } else if (isMiddleware) {
      middlewares.push({
        baseRoute: toBaseRoute(baseRoute),
        module: module as MiddlewareModule,
      });
    } else if (
      path === "/_app.tsx" || path === "/_app.ts" ||
      path === "/_app.jsx" || path === "/_app.js"
    ) {
      app = module as AppModule;
    } else if (isLayout) {
      const mod = module as LayoutModule;
      const config = mod.config;
      layouts.push({
        baseRoute: toBaseRoute(baseRoute),
        handler: mod.handler,
        component: mod.default,
        appWrapper: !config?.skipAppWrapper,
        inheritLayouts: !config?.skipInheritedLayouts,
      });
    } else if (
      path === "/_404.tsx" || path === "/_404.ts" ||
      path === "/_404.jsx" || path === "/_404.js"
    ) {
      const { default: component, config } = module as UnknownPageModule;
      let { handler } = module as UnknownPageModule;
      if (component && handler === undefined) {
        handler = (_req, { render }) => render();
      }

      notFound = {
        baseRoute: ROOT_BASE_ROUTE,
        pattern: pathToPattern(baseRoute),
        url,
        name,
        component,
        handler: handler ?? ((req) => router.defaultOtherHandler(req)),
        csp: Boolean(config?.csp ?? false),
        appWrapper: !config?.skipAppWrapper,
        inheritLayouts: !config?.skipInheritedLayouts,
      };
    } else if (
      path === "/_500.tsx" || path === "/_500.ts" ||
      path === "/_500.jsx" || path === "/_500.js"
    ) {
      const { default: component, config: routeConfig } =
        module as ErrorPageModule;
      let { handler } = module as ErrorPageModule;
      if (component && handler === undefined) {
        handler = (_req, { render }) => render();
      }

      error = {
        baseRoute: toBaseRoute("/"),
        pattern: pathToPattern(baseRoute),
        url,
        name,
        component,
        handler: handler ?? router.defaultErrorHandler,
        csp: Boolean(routeConfig?.csp ?? false),
        appWrapper: !routeConfig?.skipAppWrapper,
        inheritLayouts: !routeConfig?.skipInheritedLayouts,
      };
    }
  }

  const processedIslands: {
    name: string;
    path: string;
    module: IslandModule;
  }[] = [];

  for (const plugin of config.plugins || []) {
    if (!plugin.islands) continue;
    const base = dirname(plugin.islands.baseLocation);

    for (const specifier of plugin.islands.paths) {
      const full = join(base, specifier);
      const module = await import(full);
      const name = sanitizeIslandName(basename(full, extname(full)));
      processedIslands.push({
        name,
        path: full,
        module,
      });
    }
  }

  for (const [self, module] of Object.entries(manifest.islands)) {
    const url = new URL(self, baseUrl).href;
    if (!url.startsWith(baseUrl)) {
      throw new TypeError("Island is not a child of the basepath.");
    }
    let path = url.substring(baseUrl.length);
    if (path.startsWith("islands")) {
      path = path.slice("islands".length + 1);
    }
    const baseRoute = path.substring(0, path.length - extname(path).length);

    processedIslands.push({
      name: sanitizeIslandName(baseRoute),
      path: url,
      module,
    });
  }

  for (const processedIsland of processedIslands) {
    for (
      const [exportName, exportedFunction] of Object.entries(
        processedIsland.module,
      )
    ) {
      if (typeof exportedFunction !== "function") continue;
      const name = processedIsland.name.toLowerCase();
      const id = `${name}_${exportName.toLowerCase()}`;
      islands.push({
        id,
        name,
        url: processedIsland.path,
        // deno-lint-ignore no-explicit-any
        component: exportedFunction as ComponentType<any>,
        exportName,
      });
    }
  }

  const staticFiles: StaticFile[] = [];
  try {
    const staticDirs = [config.staticDir];

    // Only fall through to files in /_fresh/static when not in dev
    if (state.loadSnapshot) {
      const outDirStatic = join(config.build.outDir, "static");
      staticDirs.push(outDirStatic);
    }

    for (const staticDir of staticDirs) {
      const staticDirUrl = toFileUrl(staticDir);
      const entries = walk(staticDir, {
        includeFiles: true,
        includeDirs: false,
        followSymlinks: false,
      });
      const encoder = new TextEncoder();
      for await (const entry of entries) {
        const localUrl = toFileUrl(entry.path);
        const path = localUrl.href.substring(staticDirUrl.href.length);
        const stat = await Deno.stat(localUrl);
        const type = contentType(extname(path)) ??
          "application/octet-stream";
        const etag = await crypto.subtle.digest(
          "SHA-1",
          encoder.encode(BUILD_ID + path),
        ).then((hash) =>
          Array.from(new Uint8Array(hash))
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("")
        );
        const staticFile: StaticFile = {
          localUrl,
          path: join(state.config.basePath, path),
          size: stat.size,
          contentType: type,
          etag,
        };
        staticFiles.push(staticFile);
      }
    }
  } catch (err) {
    if (err.cause instanceof Deno.errors.NotFound) {
      // Do nothing.
    } else {
      throw err;
    }
  }

  return {
    app,
    error,
    islands,
    layouts,
    middlewares,
    notFound,
    routes,
    staticFiles,
  };
}

const APP_REG = /_app\.[tj]sx?$/;

/**
 * Sort route paths where special Fresh files like `_app`,
 * `_layout` and `_middleware` are sorted in front.
 */
export function sortRoutePaths(a: string, b: string) {
  // The `_app` route should always be the first
  if (APP_REG.test(a)) return -1;
  else if (APP_REG.test(b)) return 1;

  let segmentIdx = 0;
  const aLen = a.length;
  const bLen = b.length;
  const maxLen = aLen > bLen ? aLen : bLen;
  for (let i = 0; i < maxLen; i++) {
    const charA = a.charAt(i);
    const charB = b.charAt(i);
    const nextA = i + 1 < aLen ? a.charAt(i + 1) : "";
    const nextB = i + 1 < bLen ? b.charAt(i + 1) : "";

    if (charA === "/" || charB === "/") {
      segmentIdx = i;
      // If the other path doesn't close the segment
      // then we don't need to continue
      if (charA !== "/") return -1;
      if (charB !== "/") return 1;
      continue;
    }

    if (i === segmentIdx + 1) {
      const scoreA = getRoutePathScore(charA, nextA);
      const scoreB = getRoutePathScore(charB, nextB);
      if (scoreA === scoreB) continue;
      return scoreA > scoreB ? -1 : 1;
    }
  }

  return 0;
}

/**
 * Assign a score based on the first two characters of a path segment.
 * The goal is to sort `_middleware` and `_layout` in front of everything
 * and `[` or `[...` last respectively.
 */
function getRoutePathScore(char: string, nextChar: string): number {
  if (char === "_") {
    if (nextChar === "m") return 4;
    return 3;
  } else if (char === "[") {
    if (nextChar === ".") {
      return 0;
    }
    return 1;
  }
  return 2;
}

/**
 * Transform a filesystem URL path to a `path-to-regex` style matcher. */
export function pathToPattern(path: string): string {
  const parts = path.split("/");
  if (parts[parts.length - 1] === "index") {
    if (parts.length === 1) {
      return "/";
    }
    parts.pop();
  }

  let route = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Case: /[...foo].tsx
    if (part.startsWith("[...") && part.endsWith("]")) {
      route += `/:${part.slice(4, part.length - 1)}*`;
      continue;
    }

    // Route groups like /foo/(bar) should not be included in URL
    // matching. They are transparent and need to be removed here.
    // Case: /foo/(bar) -> /foo
    // Case: /foo/(bar)/bob -> /foo/bob
    // Case: /(foo)/bar -> /bar
    if (part.startsWith("(") && part.endsWith(")")) {
      continue;
    }

    // Disallow neighbouring params like `/[id][bar].tsx` because
    // it's ambiguous where the `id` param ends and `bar` begins.
    if (part.includes("][")) {
      throw new SyntaxError(
        `Invalid route pattern: "${path}". A parameter cannot be followed by another parameter without any characters in between.`,
      );
    }

    // Case: /[[id]].tsx
    // Case: /[id].tsx
    // Case: /[id]@[bar].tsx
    // Case: /[id]-asdf.tsx
    // Case: /[id]-asdf[bar].tsx
    // Case: /asdf[bar].tsx
    let pattern = "";
    let groupOpen = 0;
    let optional = false;
    for (let j = 0; j < part.length; j++) {
      const char = part[j];
      if (char === "[") {
        if (part[j + 1] === "[") {
          // Disallow optional dynamic params like `foo-[[bar]]`
          if (part[j - 1] !== "/" && !!part[j - 1]) {
            throw new SyntaxError(
              `Invalid route pattern: "${path}". An optional parameter needs to be a full segment.`,
            );
          }
          groupOpen++;
          optional = true;
          pattern += "{/";
          j++;
        }
        pattern += ":";
        groupOpen++;
      } else if (char === "]") {
        if (part[j + 1] === "]") {
          // Disallow optional dynamic params like `[[foo]]-bar`
          if (part[j + 2] !== "/" && !!part[j + 2]) {
            throw new SyntaxError(
              `Invalid route pattern: "${path}". An optional parameter needs to be a full segment.`,
            );
          }
          groupOpen--;
          pattern += "}?";
          j++;
        }
        if (--groupOpen < 0) {
          throw new SyntaxError(`Invalid route pattern: "${path}"`);
        }
      } else {
        pattern += char;
      }
    }

    route += (optional ? "" : "/") + pattern;
  }

  // Case: /(group)/index.tsx
  if (route === "") {
    route = "/";
  }

  return route;
}

function toPascalCase(text: string): string {
  return text.replace(
    /(^\w|-\w)/g,
    (substring) => substring.replace(/-/, "").toUpperCase(),
  );
}

function sanitizeIslandName(name: string): string {
  const fileName = stringToIdentifier(name);
  return toPascalCase(fileName);
}

function formatMiddlewarePath(path: string): string {
  const prefix = !path.startsWith("/") ? "/" : "";
  const suffix = !path.endsWith("/") ? "/" : "";
  return prefix + path + suffix;
}

function getMiddlewareRoutesFromPlugins(
  plugins: Plugin[],
): [string, MiddlewareModule][] {
  const middlewares = plugins.flatMap((plugin) => plugin.middlewares ?? []);

  const mws: Record<
    string,
    [string, { handler: MiddlewareHandler[] }]
  > = {};
  for (let i = 0; i < middlewares.length; i++) {
    const mw = middlewares[i];
    const handler = mw.middleware.handler;
    const key = `./routes${formatMiddlewarePath(mw.path)}_middleware.ts`;
    if (!mws[key]) mws[key] = [key, { handler: [] }];
    mws[key][1].handler.push(...Array.isArray(handler) ? handler : [handler]);
  }

  return Object.values(mws);
}

function formatRoutePath(path: string) {
  return path.startsWith("/") ? path : "/" + path;
}

function getRoutesFromPlugins(plugins: Plugin[]): [string, RouteModule][] {
  return plugins.flatMap((plugin) => plugin.routes ?? [])
    .map((route) => {
      return [`./routes${formatRoutePath(route.path)}.ts`, {
        // deno-lint-ignore no-explicit-any
        default: route.component as any,
        handler: route.handler,
      }];
    });
}
