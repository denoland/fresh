import { ComponentType } from "../runtime/deps.ts";
import { ConnInfo, router } from "./deps.ts";
import {
  AppProps,
  ErrorPageProps,
  PageConfig,
  PageProps,
  UnknownPageProps,
} from "../runtime/types.ts";
import { RenderContext, RenderFn } from "./render.tsx";

export interface PageModule {
  default?: ComponentType<PageProps>;
  // deno-lint-ignore no-explicit-any
  handler?: Handler<any, any> | Handlers<any, any>;
  config?: PageConfig;
}

export interface UnknownPageModule {
  default?: ComponentType<UnknownPageProps>;
  handler?: UnknownHandler;
  config?: PageConfig;
}

export interface ErrorPageModule {
  default?: ComponentType<ErrorPageProps>;
  handler?: ErrorHandler;
  config?: PageConfig;
}

export interface IslandModule {
  // deno-lint-ignore no-explicit-any
  default: ComponentType<any>;
}

export interface HandlerContext<T = unknown, TState = Record<string, unknown>>
  extends ConnInfo {
  params: Record<string, string>;
  render: (data?: T) => Response;
  state: TState;
}

export interface UnknownHandlerContext<TState = Record<string, unknown>>
  extends ConnInfo {
  render: () => Response;
  state: TState;
}

export interface ErrorHandlerContext<TState = Record<string, unknown>>
  extends ConnInfo {
  error: unknown;
  render: () => Response;
  state: TState;
}

export interface MiddlewareHandlerContext<TState = Record<string, unknown>>
  extends ConnInfo {
  handle: (state?: Record<string, unknown>) => Promise<Response>;
  state: TState;
}

// deno-lint-ignore no-explicit-any
export type Handler<T = any, TState = Record<string, unknown>> = (
  req: Request,
  ctx: HandlerContext<T, TState>,
) => Response | Promise<Response>;
export type UnknownHandler = (
  req: Request,
  ctx: UnknownHandlerContext,
) => Response | Promise<Response>;
export type ErrorHandler = (
  req: Request,
  ctx: ErrorHandlerContext,
) => Response | Promise<Response>;

// deno-lint-ignore no-explicit-any
export type Handlers<T = any, TState = Record<string, unknown>> = {
  [K in typeof router.METHODS[number]]?: Handler<T, TState>;
};

// deno-lint-ignore no-explicit-any
export interface Page<Data = any> {
  route: string;
  url: string;
  name: string;
  component?: ComponentType<PageProps<Data>>;
  handler: Handler<Data> | Handlers<Data>;
  csp: boolean;
}

export interface UnknownPage {
  route: string;
  url: string;
  name: string;
  component?: ComponentType<UnknownPageProps>;
  handler: UnknownHandler;
  csp: boolean;
}

export interface ErrorPage {
  route: string;
  url: string;
  name: string;
  component?: ComponentType<ErrorPageProps>;
  handler: ErrorHandler;
  csp: boolean;
}

export interface RendererModule {
  render(ctx: RenderContext, render: RenderFn): void;
}

export interface Renderer {
  render(ctx: RenderContext, render: RenderFn): void;
}

export interface MiddlewareModule<TState = Record<string, unknown>> {
  handler(
    req: Request,
    ctx: MiddlewareHandlerContext<TState>,
  ): Response | Promise<Response>;
}

export interface Middleware<TState = Record<string, unknown>> {
  handler(
    req: Request,
    ctx: MiddlewareHandlerContext<TState>,
  ): Response | Promise<Response>;
}

export interface MiddlewareRoute extends Middleware {
  /**
   * filesystem url path
   */
  route: string;
}

export interface AppModule {
  default: ComponentType<AppProps>;
}

export interface Island {
  id: string;
  name: string;
  url: string;
  component: ComponentType<unknown>;
}

declare global {
  // deno-lint-ignore no-explicit-any no-var
  var URLPattern: any;
}
