import { ComponentType } from "../runtime/deps.ts";
import { ConnInfo, router, ServeInit } from "./deps.ts";
import {
  AppProps,
  ErrorPageProps,
  PageConfig,
  PageProps,
  UnknownPageProps,
} from "../runtime/types.ts";
import { RenderContext, RenderFn } from "./render.tsx";

export interface RouterState {
  state: Record<string, unknown>;
}

export type StartOptions = ServeInit;

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

export interface HandlerContext<Data = unknown, State = Record<string, unknown>>
  extends ConnInfo {
  params: Record<string, string>;
  render: (data?: Data) => Response | Promise<Response>;
  state: State;
}

export interface UnknownHandlerContext<State = Record<string, unknown>>
  extends ConnInfo {
  render: () => Response | Promise<Response>;
  state: State;
}

export interface ErrorHandlerContext<State = Record<string, unknown>>
  extends ConnInfo {
  error: unknown;
  render: () => Response | Promise<Response>;
  state: State;
}

export interface MiddlewareHandlerContext<State = Record<string, unknown>>
  extends ConnInfo {
  next: () => Promise<Response>;
  state: State;
}

// deno-lint-ignore no-explicit-any
export type Handler<T = any, State = Record<string, unknown>> = (
  req: Request,
  ctx: HandlerContext<T, State>,
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
export type Handlers<T = any, State = Record<string, unknown>> = {
  [K in typeof router.METHODS[number]]?: Handler<T, State>;
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
  render(ctx: RenderContext, render: RenderFn): void | Promise<void>;
}

export interface Renderer {
  render(ctx: RenderContext, render: RenderFn): void | Promise<void>;
}

// deno-lint-ignore no-explicit-any
export interface MiddlewareModule<State = any> {
  handler(
    req: Request,
    ctx: MiddlewareHandlerContext<State>,
  ): Response | Promise<Response>;
}

export interface Middleware<State = Record<string, unknown>> {
  handler(
    req: Request,
    ctx: MiddlewareHandlerContext<State>,
  ): Response | Promise<Response>;
}

export interface MiddlewareRoute extends Middleware {
  /**
   * path-to-regexp style url path
   */
  route: string;
  /**
   * URLPattern of the route
   */
  // deno-lint-ignore no-explicit-any
  pattern: any;
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
