// async fromManifest
// handler(): RequestHandler

import { RequestHandler, toHashString } from "./deps.ts";
import {
  Builder,
  BuildSnapshot,
  EsbuildBuilder,
  JSXConfig,
} from "../build/mod.ts";
import { BUILD_ID } from "./build_id.ts";
import { middlewarePathToPattern } from "./context.ts";
import DefaultErrorPage from "./default_error_page.ts";
import {
  dirname,
  extname,
  fromFileUrl,
  join,
  JSONC,
  Status,
  toFileUrl,
  typeByExtension,
  walk,
  WalkEntry,
} from "./deps.ts";
import {
  DenoConfig,
  ErrorHandlerContext,
  FreshOptions,
  UnknownHandlerContext,
} from "./mod.ts";
import { Manifest } from "./mod.ts";
import { KnownMethod, knownMethods } from "./router.ts";
import {
  AppModule,
  ErrorPage,
  ErrorPageModule,
  Island,
  MiddlewareModule,
  MiddlewareRoute,
  Plugin,
  RenderFunction,
  Route,
  RouteModule,
  UnknownPage,
  UnknownPageModule,
} from "./types.ts";
import { h } from "preact";
import { buildHandler } from "./handler2.ts";

export interface StaticFile {
  /** The URL to the static file on disk. */
  localUrl: URL;
  /** The path to the file as it would be in the incoming request. */
  path: string;
  /** The size of the file. */
  size: number;
  /** The content-type of the file. */
  contentType: string;
  /** Hash of the file contents. */
  etag: string;
}

export class ServerContext {
  #inner: ServerContextInner;

  constructor(inner: ServerContextInner) {
    this.#inner = inner;
  }

  static async fromManifest(
    manifest: Manifest,
    opts: FreshOptions,
  ): Promise<ServerContext> {
    const inner = await createServerContext(manifest, opts);
    return new ServerContext(inner);
  }

  handler(): RequestHandler {
    return buildHandler(this.#inner);
  }
}

export interface ServerContextInner {
  routes: Route[];
  middlewares: MiddlewareRoute[];
  appPage: AppModule;
  notFoundPage: UnknownPage;
  errorPage: ErrorPage;

  staticFiles: StaticFile[];

  plugins: Plugin[];
  islands: Island[];
  legacyRenderFn: RenderFunction;

  build: JsBuild;

  dev: boolean;
}

export class JsBuild {
  #snapshot: Promise<BuildSnapshot> | BuildSnapshot | null = null;
  #builder: Builder | null;

  constructor(builder: Builder) {
    this.#builder = builder;
  }

  snapshot() {
    if (this.#snapshot === null) {
      if (this.#builder === null) throw new Error("No builder");
      this.#snapshot = this.#builder.build()
        .then((snapshot) => {
          this.#snapshot = snapshot;
          this.#builder = null;
          return snapshot;
        })
        .catch((err) => {
          this.#snapshot = null;
          throw err;
        });
    }
    return this.#snapshot;
  }

  maybeSnapshot(): BuildSnapshot | null {
    if (this.#snapshot === null || this.#snapshot instanceof Promise) {
      return null;
    }
    return this.#snapshot;
  }
}

export async function createServerContext(
  manifest: Manifest,
  opts: FreshOptions,
): Promise<ServerContextInner> {
  // Get the manifest' base URL a nd path
  const baseUrl = new URL("./", manifest.baseUrl).href;
  const basePath = fromFileUrl(baseUrl);

  const { config, path: configPath } = await readDenoConfig(basePath);
  config.compilerOptions ??= {};

  let jsx: "react" | "react-jsx";
  switch (config.compilerOptions.jsx) {
    case "react":
    case undefined:
      jsx = "react";
      break;
    case "react-jsx":
      jsx = "react-jsx";
      break;
    default:
      throw new Error("Unknown jsx option: " + config.compilerOptions.jsx);
  }
  const jsxConfig: JSXConfig = {
    jsx,
    jsxImportSource: config.compilerOptions.jsxImportSource,
  };

  const routes: Route[] = [];
  const middlewares: MiddlewareRoute[] = [];
  const appPage: AppModule = DEFAULT_APP;
  const notFoundPage: UnknownPage = DEFAULT_NOT_FOUND;
  const errorPage: ErrorPage = DEFAULT_ERROR;
  for (const [selfUrl, module] of Object.entries(manifest.routes)) {
    const url = new URL(selfUrl, baseUrl).href; // e.g /Users/luca/fresh_project/routes/admin/index.tsx
    if (!url.startsWith(baseUrl + "routes")) {
      throw new TypeError("Route is not a child of the base path.");
    }
    const path = url.substring(baseUrl.length).substring("routes".length); // e.g /admin/index.tsx
    const baseRoute = path.substring(1, path.length - extname(path).length); // e.g admin/index

    if (baseRoute.endsWith("_middleware")) { // middleware
      let handlers = (module as MiddlewareModule).handler;
      if (!Array.isArray(handlers)) {
        handlers = [handlers];
      }
      for (const handler of handlers) {
        if (typeof handler !== "function") {
          throw new TypeError(
            `Middleware must export a handler function, or array of handler functions ('${selfUrl}').`,
          );
        }
      }
      middlewares.push({ ...middlewarePathToPattern(baseRoute), handlers });
    } else if (baseRoute === "_404") { // not found
      extractNotFoundAndError(
        module as UnknownPageModule,
        selfUrl,
        notFoundPage,
        "Not found",
      );
    } else if (baseRoute === "_500") { // error
      extractNotFoundAndError(
        module as ErrorPageModule,
        selfUrl,
        errorPage,
        "Error",
      );
    } else if (baseRoute === "_app") { // app
      const component = module;
      if (typeof component !== "function") {
        throw new TypeError(
          `App must export a component ('${selfUrl}').`,
        );
      }
      appPage.default = component;
    } else if (!baseRoute.startsWith("_")) { // normal route
      const component = (module as RouteModule).default;
      if (component !== undefined) {
        if (typeof component !== "function") {
          throw new TypeError(
            `Routes must default export a component ('${selfUrl}').`,
          );
        }
        if (
          typeof component === "function" &&
          component.constructor.name === "AsyncFunction"
        ) {
          throw new Error(
            "Async components are not supported. Fetch data inside of a route handler, as described in the docs: https://fresh.deno.dev/docs/getting-started/fetching-data",
          );
        }
      }

      let handler = (module as RouteModule).handler;
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
      if (typeof handler === "object") {
        for (const [method, func] of Object.entries(handler)) {
          if (typeof func !== "function") {
            throw new TypeError(
              `Route handler export must be a function or object of functions ('${selfUrl}').`,
            );
          }
          if (!knownMethods.includes(method as KnownMethod)) {
            throw new TypeError(
              `Route handler declares handler for unknown method '${method}' ('${selfUrl}').`,
            );
          }
        }
      } else if (typeof handler !== "function") {
        throw new TypeError(
          `Route handler export must be a function or object ('${selfUrl}').`,
        );
      }

      const config = (module as RouteModule).config;
      if (config !== undefined && typeof config !== "object") {
        throw new TypeError(
          `Route config export is not an object ('${self}').`,
        );
      }
      let pattern = pathToPattern(baseRoute);
      if (config?.routeOverride) {
        pattern = String(config.routeOverride);
      }
      const csp = Boolean(config?.csp ?? false);

      routes.push({ pattern, url, component, handler, csp });
    } else {
      // ignore unknown route kinds
    }
  }
  sortRoutes(routes);
  sortRoutes(middlewares);

  const islands: Island[] = [];
  const islandIds = new Set<string>();
  for (const [self, module] of Object.entries(manifest.islands)) {
    const url = new URL(self, baseUrl).href; // e.g /Users/luca/fresh_project/islands/something/Test.tsx
    if (!url.startsWith(baseUrl)) {
      throw new TypeError("Island is not a child of the base path.");
    }
    const path = url.substring(baseUrl.length).substring("islands".length); // e.g /something/Test.tsx
    const baseRoute = path.substring(1, path.length - extname(path).length); // e.g something/Test
    const name = sanitizeIslandName(baseRoute); // e.g SomethingTest
    const id = name.toLowerCase();
    if (typeof module.default !== "function") {
      throw new TypeError(
        `Islands must default export a component ('${self}').`,
      );
    }
    if (islandIds.has(id)) throw new Error(`Duplicate island: ${name}`);
    islandIds.add(id);
    islands.push({ id, name, url, component: module.default });
  }

  const staticFiles: StaticFile[] = [];
  const staticFolderUrl = new URL(
    opts.staticDir ?? "./static",
    manifest.baseUrl,
  );
  const entires = walk(fromFileUrl(staticFolderUrl), {
    includeFiles: true,
    includeDirs: false,
    followSymlinks: false,
  });
  while (true) {
    let entry: WalkEntry;
    try {
      const { value, done } = await entires.next();
      if (done) break;
      entry = value;
    } catch (err) {
      if (err.cause instanceof Deno.errors.NotFound) {
        // Do nothing.
        continue;
      } else {
        throw err;
      }
    }
    const localUrl = toFileUrl(entry.path); // e.g file:///Users/luca/fresh_project/static/logo.png
    const path = localUrl.href.substring(staticFolderUrl.href.length); // e.g /logo.png
    const stat = await Deno.stat(localUrl);
    const contentType = typeByExtension(extname(path)) ??
      "application/octet-stream";
    const etagBytes = await crypto.subtle.digest(
      "SHA-1",
      new TextEncoder().encode(BUILD_ID + path),
    );
    const etag = toHashString(etagBytes);
    staticFiles.push({ localUrl, path, size: stat.size, contentType, etag });
  }

  const plugins = opts.plugins ?? [];
  const dev = Deno.env.has("DENO_DEPLOYMENT_ID"); // env var is only set in prod (on for example in Deno Deploy)
  const builder = new EsbuildBuilder({
    buildID: BUILD_ID,
    entrypoints: collectEntrypoints(dev, islands, plugins),
    configPath,
    dev,
    jsxConfig,
  });

  return {
    routes,
    islands,
    staticFiles,
    middlewares,

    appPage,
    notFoundPage,
    errorPage,

    legacyRenderFn: opts.render ?? DEFAULT_RENDER_FN,
    plugins,

    dev,
    build: new JsBuild(builder),
  };
}

function extractNotFoundAndError<M extends UnknownPageModule | ErrorPageModule>(
  module: M,
  selfUrl: string,
  route: M extends UnknownPageModule ? UnknownPage : ErrorPage,
  kind: "Not found" | "Error",
) {
  const component = (module as UnknownPageModule).default;
  if (component !== undefined && typeof component !== "function") {
    throw new TypeError(
      `${kind} route component export is not a function ('${selfUrl}').`,
    );
  }
  if (component !== undefined) {
    route.component = component;
  }

  const handler = (module as UnknownPageModule).handler;
  if (handler !== undefined && typeof handler !== "function") {
    throw new TypeError(
      `${kind} route handler export is not a function ('${selfUrl}').`,
    );
  }
  if (handler !== undefined) {
    route.handler = handler;
  } else if (
    route.handler !== DEFAULT_NOT_FOUND.handler && route.component !== undefined
  ) {
    route.handler = (
      _: Request,
      ctx: UnknownHandlerContext | ErrorHandlerContext,
    ) => ctx.render();
  }

  const config = (module as UnknownPageModule).config;
  if (config !== undefined && typeof config !== "object") {
    throw new TypeError(
      `${kind} route config export is not an object ('${selfUrl}').`,
    );
  }
  route.csp = Boolean(config?.csp ?? route.csp);

  if (route.handler === undefined) {
    throw new TypeError(
      `${kind} route handler is required ('${selfUrl}').`,
    );
  }
}

async function readDenoConfig(
  directory: string,
): Promise<{ config: DenoConfig; path: string }> {
  let dir = directory;
  while (true) {
    for (const name of ["deno.json", "deno.jsonc"]) {
      const path = join(dir, name);
      try {
        const file = await Deno.readTextFile(path);
        if (name.endsWith(".jsonc")) {
          return { config: JSONC.parse(file) as DenoConfig, path };
        } else {
          return { config: JSON.parse(file), path };
        }
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
      }
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Could not find a deno.json file in the current directory or any parent directory.`,
      );
    }
    dir = parent;
  }
}

/**
 * - `test-cases -> TestCases`
 * - `test_cases -> TestCases`
 * - `test/cases -> TestCases`
 * - `Test/Cases -> TestCases`
 */
function sanitizeIslandName(name: string): string {
  return name.replace(
    /(^\w|-\w|_\w|\/\w)/g,
    (substring) => substring.replace(/-/, "").toUpperCase(),
  );
}

/** Transform a filesystem URL path to a `path-to-regex` style matcher. */
function pathToPattern(path: string): string {
  const parts = path.split("/");
  if (parts[parts.length - 1] === "index") {
    parts.pop();
  }
  const route = "/" + parts
    .map((part) => {
      if (part.startsWith("[...") && part.endsWith("]")) {
        return `:${part.slice(4, part.length - 1)}*`;
      }
      if (part.startsWith("[") && part.endsWith("]")) {
        return `:${part.slice(1, part.length - 1)}`;
      }
      return part;
    })
    .join("/");
  return route;
}

/**
 * Sort pages by their relative routing priority, based on the parts in the
 * route matcher.
 */
function sortRoutes<T extends { pattern: string }>(routes: T[]) {
  routes.sort((a, b) => {
    const partsA = a.pattern.split("/");
    const partsB = b.pattern.split("/");
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i];
      const partB = partsB[i];
      if (partA === undefined) return -1;
      if (partB === undefined) return 1;
      if (partA === partB) continue;
      const priorityA = partA.startsWith(":") ? partA.endsWith("*") ? 0 : 1 : 2;
      const priorityB = partB.startsWith(":") ? partB.endsWith("*") ? 0 : 1 : 2;
      return Math.max(Math.min(priorityB - priorityA, 1), -1);
    }
    return 0;
  });
}

function collectEntrypoints(
  dev: boolean,
  islands: Island[],
  plugins: Plugin[],
): Record<string, string> {
  const entrypointBase = "../runtime/entrypoints";
  const entryPoints: Record<string, string> = {
    main: dev
      ? import.meta.resolve(`${entrypointBase}/main_dev.ts`)
      : import.meta.resolve(`${entrypointBase}/main.ts`),
    deserializer: import.meta.resolve(`${entrypointBase}/deserializer.ts`),
  };

  try {
    import.meta.resolve("@preact/signals");
    entryPoints.signals = import.meta.resolve(`${entrypointBase}/signals.ts`);
  } catch {
    // @preact/signals is not in the import map
  }

  for (const island of islands) {
    entryPoints[`island-${island.id}`] = island.url;
  }

  for (const plugin of plugins) {
    for (const [name, url] of Object.entries(plugin.entrypoints ?? {})) {
      entryPoints[`plugin-${plugin.name}-${name}`] = url;
    }
  }

  return entryPoints;
}

const DEFAULT_RENDER_FN: RenderFunction = (_ctx, render) => {
  render();
};

const DEFAULT_APP: AppModule = {
  default: ({ Component }) => h(Component, {}),
};

const DEFAULT_NOT_FOUND: UnknownPage = {
  handler: () => new Response("404 Not Found", { status: Status.NotFound }),
  csp: false,
};

const DEFAULT_ERROR: ErrorPage = {
  component: DefaultErrorPage,
  handler: (_req, ctx) => ctx.render(),
  csp: false,
};
