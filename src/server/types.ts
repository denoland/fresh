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

export type StartOptions = ServeInit;

export interface PageModule {
  default?: ComponentType<PageProps>;
  handler?: Handler | Handlers;
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

export interface HandlerContext<T = unknown> extends ConnInfo {
  params: Record<string, string>;
  render: (data?: T) => Response | Promise<Response>;
}

export interface UnknownHandlerContext extends ConnInfo {
  render: () => Response | Promise<Response>;
}

export interface ErrorHandlerContext extends ConnInfo {
  error: unknown;
  render: () => Response | Promise<Response>;
}

export interface MiddlewareHandlerContext extends ConnInfo {
  handle: () => Promise<Response>;
}

// deno-lint-ignore no-explicit-any
export type Handler<T = any> = (
  req: Request,
  ctx: HandlerContext<T>,
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
export type Handlers<T = any> = {
  [K in typeof router.METHODS[number]]?: Handler<T>;
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

export interface MiddlewareModule {
  handler(
    req: Request,
    ctx: MiddlewareHandlerContext,
  ): Response | Promise<Response>;
}

export interface Middleware {
  handler(
    req: Request,
    ctx: MiddlewareHandlerContext,
  ): Response | Promise<Response>;
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
