import { ComponentChildren, ComponentType, VNode } from "preact";
import * as router from "./router.ts";
import { InnerRenderFunction, RenderContext } from "./render.ts";
import { Manifest } from "./mod.ts";

export interface DenoConfig {
  imports?: Record<string, string>;
  importMap?: string;
  tasks?: Record<string, string>;
  lint?: {
    rules: { tags?: string[] };
    exclude?: string[];
  };
  fmt?: {
    exclude?: string[];
  };
  exclude?: string[];
  compilerOptions?: {
    jsx?: string;
    jsxImportSource?: string;
  };
}

// --- APPLICATION CONFIGURATION ---

/**
 * @deprecated Use {@linkcode FreshConfig} instead
 */
export type StartOptions = FreshConfig;

/**
 * @deprecated Use {@linkcode FreshConfig} interface instead.
 */
export type FreshOptions = FreshConfig;

export interface FreshConfig {
  build?: {
    /**
     * The directory to write generated files to when `dev.ts build` is run.
     * This can be an absolute path, a file URL or a relative path.
     */
    outDir?: string;
    /**
     * This sets the target environment for the generated code. Newer
     * language constructs will be transformed to match the specified
     * support range. See https://esbuild.github.io/api/#target
     * @default {"es2022"}
     */
    target?: string | string[];
  };
  render?: RenderFunction;
  plugins?: Plugin[];
  staticDir?: string;
  router?: RouterOptions;
  server?: Partial<Deno.ServeTlsOptions>;

  // Older versions of Fresh merged the `Deno.ServeTlsOptions` directly.
  // We've moved this to `server`.

  /**
   * Server private key in PEM format
   * @deprecated Use `server.cert` instead
   */
  cert?: string;
  /**
   * Cert chain in PEM format
   * @deprecated Use `server.key` instead
   */
  key?: string;
  /**
   * The port to listen on.
   * @default {8000}
   * @deprecated Use `server.port` instead
   */
  port?: number;
  /**
   * A literal IP address or host name that can be resolved to an IP address.
   *
   * __Note about `0.0.0.0`__ While listening `0.0.0.0` works on all platforms,
   * the browsers on Windows don't work with the address `0.0.0.0`.
   * You should show the message like `server running on localhost:8080` instead of
   * `server running on 0.0.0.0:8080` if your program supports Windows.
   *
   * @default {"0.0.0.0"}
   * @deprecated Use `server.hostname` instead
   */
  hostname?: string;
  /**
   * An {@linkcode AbortSignal} to close the server and all connections.
   * @deprecated Use `server.signal` instead
   */
  signal?: AbortSignal;
  /**
   * Sets `SO_REUSEPORT` on POSIX systems.
   * @deprecated Use `server.reusePort` instead
   */
  reusePort?: boolean;
  /**
   * The handler to invoke when route handlers throw an error.
   * @deprecated Use `server.onError` instead
   */
  onError?: (error: unknown) => Response | Promise<Response>;

  /**
   * The callback which is called when the server starts listening.
   * @deprecated Use `server.onListen` instead
   */
  onListen?: (params: { hostname: string; port: number }) => void;
}

export interface InternalFreshConfig {
  dev: boolean;
  loadSnapshot: boolean;
  denoJsonPath: string;
  denoJson: DenoConfig;
  manifest: Manifest;
  build: {
    outDir: string;
    target: string | string[];
  };
  render?: RenderFunction;
  plugins: Plugin[];
  staticDir: string;
  router?: RouterOptions;
  server: Partial<Deno.ServeTlsOptions>;
}

export interface RouterOptions {
  /**
   *  Controls whether Fresh will append a trailing slash to the URL.
   *  @default {false}
   */
  trailingSlash?: boolean;
  /**
   *  Configures the pattern of files to ignore in islands and routes.
   *
   *  By default Fresh will ignore test files,
   *  for example files with a `.test.ts` or a `_test.ts` suffix.
   *
   *  @default {/(?:[^/]*_|[^/]*\.|)test\.(?:ts|tsx|mts|js|mjs|jsx|)\/*$/}
   */
  ignoreFilePattern?: RegExp;
}

export type RenderFunction = (
  ctx: RenderContext,
  render: InnerRenderFunction,
) => void | Promise<void>;

/// --- ROUTES ---

// deno-lint-ignore no-explicit-any
export interface PageProps<T = any, S = Record<string, unknown>> {
  /** The URL of the request that resulted in this page being rendered. */
  url: URL;

  /** The route matcher (e.g. /blog/:id) that the request matched for this page
   * to be rendered. */
  route: string;

  /**
   * The parameters that were matched from the route.
   *
   * For the `/foo/:bar` route with url `/foo/123`, `params` would be
   * `{ bar: '123' }`. For a route with no matchers, `params` would be `{}`. For
   * a wildcard route, like `/foo/:path*` with url `/foo/bar/baz`, `params` would
   * be `{ path: 'bar/baz' }`.
   */
  params: Record<string, string>;

  /**
   * Additional data passed into `HandlerContext.render`. Defaults to
   * `undefined`.
   */
  data: T;
  state: S;
}

/**
 * Context passed to async route components.
 */
// deno-lint-ignore no-explicit-any
export type RouteContext<T = any, S = Record<string, unknown>> = {
  /** @types deprecated */
  localAddr?: Deno.NetAddr;
  remoteAddr: Deno.NetAddr;
  renderNotFound: (data?: T) => Response | Promise<Response>;
  url: URL;
  route: string;
  params: Record<string, string>;
  state: S;
  data: T;
};

export interface RouteConfig {
  /**
   * A route override for the page. This is useful for pages where the route
   * can not be expressed through the filesystem routing capabilities.
   *
   * The route override must be a path-to-regexp compatible route matcher.
   */
  routeOverride?: string;

  /**
   * If Content-Security-Policy should be enabled for this page. If 'true', a
   * locked down policy will be used that allows only the scripts and styles
   * that are generated by Fresh. Additional scripts and styles can be added
   * using the `useCSP` hook.
   */
  csp?: boolean;

  /**
   * Skip already inherited layouts
   * Default: `false`
   */
  skipInheritedLayouts?: boolean;

  /**
   * Skip rendering the `routes/_app` template
   * Default: `false`
   */
  skipAppWrapper?: boolean;
}

// deno-lint-ignore no-empty-interface
export interface RenderOptions extends ResponseInit {}

export type ServeHandlerInfo = {
  /**
   * Backwards compatible with std/server
   * @deprecated
   */
  localAddr?: Deno.NetAddr;
  remoteAddr: Deno.NetAddr;
};

export type ServeHandler = (
  request: Request,
  info: ServeHandlerInfo,
) => Response | Promise<Response>;

export interface HandlerContext<
  Data = unknown,
  State = Record<string, unknown>,
  NotFoundData = Data,
> extends ServeHandlerInfo {
  params: Record<string, string>;
  render: (
    data?: Data,
    options?: RenderOptions,
  ) => Response | Promise<Response>;
  renderNotFound: (data?: NotFoundData) => Response | Promise<Response>;
  state: State;
}

// deno-lint-ignore no-explicit-any
export type Handler<T = any, State = Record<string, unknown>> = (
  req: Request,
  ctx: HandlerContext<T, State>,
) => Response | Promise<Response>;

// deno-lint-ignore no-explicit-any
export type Handlers<T = any, State = Record<string, unknown>> = {
  [K in router.KnownMethod]?: Handler<T, State>;
};

/**
 * @deprecated This type was a short-lived alternative to `Handlers`. Please use `Handlers` instead.
 */
export type MultiHandler<T> = Handlers<T>;

export interface RouteModule {
  default?: PageComponent<PageProps>;
  // deno-lint-ignore no-explicit-any
  handler?: Handler<any, any> | Handlers<any, any>;
  config?: RouteConfig;
}

// deno-lint-ignore no-explicit-any
export type AsyncRoute<T = any, S = Record<string, unknown>> = (
  req: Request,
  ctx: RouteContext<T, S>,
) => Promise<ComponentChildren | Response>;
// deno-lint-ignore no-explicit-any
export type PageComponent<T = any, S = Record<string, unknown>> =
  | ComponentType<PageProps<T, S>>
  | AsyncRoute<T, S>
  // deno-lint-ignore no-explicit-any
  | ((props: any) => VNode<any> | ComponentChildren);

// deno-lint-ignore no-explicit-any
export interface Route<Data = any> {
  baseRoute: BaseRoute;
  pattern: string;
  url: string;
  name: string;
  component?: PageComponent<Data> | AsyncLayout<Data> | AsyncRoute<Data>;
  handler: Handler<Data> | Handlers<Data>;
  csp: boolean;
  appWrapper: boolean;
  inheritLayouts: boolean;
}

export interface RouterState {
  state: Record<string, unknown>;
}

// --- APP ---

// deno-lint-ignore no-explicit-any
export type AppProps<T = any, S = Record<string, unknown>> = LayoutProps<T, S>;

export interface AppModule {
  default: ComponentType<AppProps> | AsyncLayout;
}

// deno-lint-ignore no-explicit-any
export type AppContext<T = any, S = Record<string, unknown>> =
  & RouteContext<T, S>
  & {
    Component: () => VNode;
  };
// deno-lint-ignore no-explicit-any
export type LayoutContext<T = any, S = Record<string, unknown>> = AppContext<
  T,
  S
>;

// deno-lint-ignore no-explicit-any
export interface LayoutProps<T = any, S = Record<string, unknown>>
  extends PageProps<T, S> {
  Component: ComponentType<Record<never, never>>;
}
// deno-lint-ignore no-explicit-any
export type AsyncLayout<T = any, S = Record<string, unknown>> = (
  req: Request,
  ctx: LayoutContext<T, S>,
) => Promise<ComponentChildren | Response>;

export interface LayoutConfig {
  /**
   * Skip already inherited layouts
   * Default: `false`
   */
  skipAppWrapper?: boolean;
  /**
   * Skip rendering the `routes/_app`.
   * Default: `false`
   */
  skipInheritedLayouts?: boolean;
}

export interface LayoutModule {
  // deno-lint-ignore no-explicit-any
  handler?: Handler<any, any> | Handlers<any, any>;
  default: ComponentType<LayoutProps> | AsyncLayout;
  config?: LayoutConfig;
}

export interface LayoutRoute {
  baseRoute: BaseRoute;
  // deno-lint-ignore no-explicit-any
  handler?: Handler<any, any> | Handlers<any, any>;
  component: LayoutModule["default"];
  appWrapper: boolean;
  inheritLayouts: boolean;
}

// --- UNKNOWN PAGE ---

// deno-lint-ignore no-explicit-any
export interface UnknownPageProps<T = any, S = Record<string, unknown>> {
  /** The URL of the request that resulted in this page being rendered. */
  url: URL;

  /** The route matcher (e.g. /blog/:id) that the request matched for this page
   * to be rendered. */
  route: string;

  /**
   * Additional data passed into `HandlerContext.renderNotFound`. Defaults to
   * `undefined`.
   */
  data: T;
  state: S;
}

export interface UnknownHandlerContext<State = Record<string, unknown>>
  extends ServeHandlerInfo {
  render: () => Response | Promise<Response>;
  state: State;
}

export type UnknownHandler = (
  req: Request,
  ctx: UnknownHandlerContext,
) => Response | Promise<Response>;

export interface UnknownPageModule {
  default?: PageComponent<UnknownPageProps>;
  handler?: UnknownHandler;
  config?: RouteConfig;
}

export interface UnknownPage {
  baseRoute: BaseRoute;
  pattern: string;
  url: string;
  name: string;
  component?: PageComponent<UnknownPageProps>;
  handler: UnknownHandler;
  csp: boolean;
  appWrapper: boolean;
  inheritLayouts: boolean;
}

// --- ERROR PAGE ---

export interface ErrorPageProps {
  /** The URL of the request that resulted in this page being rendered. */
  url: URL;

  /** The route matcher (e.g. /blog/:id) that the request matched for this page
   * to be rendered. */
  pattern: string;

  /** The error that caused the error page to be loaded. */
  error: unknown;

  /** Sringified code frame (only in development mode) */
  codeFrame?: string;
}

export interface ErrorHandlerContext<State = Record<string, unknown>>
  extends ServeHandlerInfo {
  error: unknown;
  render: () => Response | Promise<Response>;
  state: State;
}

// Nominal/Branded type. Ensures that the string has the expected format
export type BaseRoute = string & { readonly __brand: unique symbol };

export type ErrorHandler = (
  req: Request,
  ctx: ErrorHandlerContext,
) => Response | Promise<Response>;

export interface ErrorPageModule {
  default?: PageComponent<ErrorPageProps>;
  handler?: ErrorHandler;
  config?: RouteConfig;
}

export interface ErrorPage {
  baseRoute: BaseRoute;
  pattern: string;
  url: string;
  name: string;
  component?: PageComponent<ErrorPageProps>;
  handler: ErrorHandler;
  csp: boolean;
  appWrapper: boolean;
  inheritLayouts: boolean;
}

// --- MIDDLEWARES ---

export interface MiddlewareHandlerContext<State = Record<string, unknown>>
  extends ServeHandlerInfo {
  next: () => Promise<Response>;
  state: State;
  destination: router.DestinationKind;
  params: Record<string, string>;
}

export interface MiddlewareRoute {
  baseRoute: BaseRoute;
  module: Middleware;
}

export type MiddlewareHandler<State = Record<string, unknown>> = (
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) => Response | Promise<Response>;

// deno-lint-ignore no-explicit-any
export interface MiddlewareModule<State = any> {
  handler: MiddlewareHandler<State> | MiddlewareHandler<State>[];
}

export interface Middleware<State = Record<string, unknown>> {
  handler: MiddlewareHandler<State> | MiddlewareHandler<State>[];
}

// --- ISLANDS ---

export interface IslandModule {
  // deno-lint-ignore no-explicit-any
  [key: string]: ComponentType<any>;
}

export interface Island {
  id: string;
  name: string;
  url: string;
  component: ComponentType<unknown>;
  exportName: string;
}

// --- PLUGINS ---

export interface Plugin<State = Record<string, unknown>> {
  /** The name of the plugin. Must be snake-case. */
  name: string;

  /** A map of a snake-case names to a import specifiers. The entrypoints
   * declared here can later be used in the "scripts" option of
   * `PluginRenderResult` to load the entrypoint's code on the client.
   */
  entrypoints?: Record<string, string>;

  /** The render hook is called on the server every time some JSX needs to
   * be turned into HTML. The render hook needs to call the `ctx.render`
   * function exactly once.
   *
   * The hook can return a `PluginRenderResult` object that can do things like
   * inject CSS into the page, or load additional JS files on the client.
   */
  render?(ctx: PluginRenderContext): PluginRenderResult;

  /** The asynchronous render hook is called on the server every time some
   * JSX needs to be turned into HTML, wrapped around all synchronous render
   * hooks. The render hook needs to call the `ctx.renderAsync` function
   * exactly once, and await the result.
   *
   * This is useful for when plugins are generating styles and scripts with
   * asynchronous dependencies. Unlike the synchronous render hook, async render
   * hooks for multiple pages can be running at the same time. This means that
   * unlike the synchronous render hook, you can not use global variables to
   * propagate state between the render hook and the renderer.
   */
  renderAsync?(ctx: PluginAsyncRenderContext): Promise<PluginRenderResult>;

  /**
   * Called before running the Fresh build task
   */
  buildStart?(): Promise<void> | void;
  /**
   * Called after completing the Fresh build task
   */
  buildEnd?(): Promise<void> | void;

  routes?: PluginRoute[];

  middlewares?: PluginMiddleware<State>[];
}

export interface PluginRenderContext {
  render: PluginRenderFunction;
}

export interface PluginAsyncRenderContext {
  renderAsync: PluginAsyncRenderFunction;
}

export interface PluginRenderResult {
  /** CSS styles to be injected into the page. */
  styles?: PluginRenderStyleTag[];
  /** JS scripts to ship to the client. */
  scripts?: PluginRenderScripts[];
}

export interface PluginRenderStyleTag {
  cssText: string;
  media?: string;
  id?: string;
}

export interface PluginRenderScripts {
  /** The "key" of the entrypoint (as specified in `Plugin.entrypoints`) for the
   * script that should be loaded. The script must be an ES module that exports
   * a default function.
   *
   * The default function is invoked with the `state` argument specified below.
   */
  entrypoint: string;
  /** The state argument that is passed to the default export invocation of the
   * entrypoint's default export. The state must be JSON-serializable.
   */
  state: unknown;
}

export type PluginRenderFunction = () => PluginRenderFunctionResult;

export type PluginAsyncRenderFunction = () =>
  | PluginRenderFunctionResult
  | Promise<PluginRenderFunctionResult>;

export interface PluginRenderFunctionResult {
  /** The HTML text that was rendered. */
  htmlText: string;
  /** If the renderer encountered any islands that require hydration on the
   * client. */
  requiresHydration: boolean;
}

export interface PluginMiddleware<State = Record<string, unknown>> {
  /** A path in the format of a filename path without filetype */
  path: string;

  middleware: Middleware<State>;
}

export interface PluginRoute {
  /** A path in the format of a filename path without filetype */
  path: string;

  component?: ComponentType<PageProps> | ComponentType<AppProps>;

  // deno-lint-ignore no-explicit-any
  handler?: Handler<any, any> | Handlers<any, any>;
}
