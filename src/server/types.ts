import { ComponentType } from "../runtime/deps.ts";
import { router } from "./deps.ts";
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

export interface HandlerContext<T = unknown> {
  req: Request;
  match: Record<string, string>;
  render: (data?: T) => Response;
}

export interface UnknownHandlerContext {
  req: Request;
  render: () => Response;
}

export interface ErrorHandlerContext {
  req: Request;
  error: unknown;
  render: () => Response;
}

// deno-lint-ignore no-explicit-any
export type Handler<T = any> = (
  ctx: HandlerContext<T>,
) => Response | Promise<Response>;
export type UnknownHandler = (
  ctx: UnknownHandlerContext,
) => Response | Promise<Response>;
export type ErrorHandler = (
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
  runtimeJS: boolean;
  csp: boolean;
}

export interface ErrorPage {
  route: string;
  url: string;
  name: string;
  component?: ComponentType<ErrorPageProps>;
  handler: ErrorHandler;
  runtimeJS: boolean;
  csp: boolean;
}

export interface RendererModule {
  render(ctx: RenderContext, render: RenderFn): void;
}

export interface Renderer {
  render(ctx: RenderContext, render: RenderFn): void;
}

export interface MiddlewareModule {
  handler(
    req: Request,
    handle: () => Promise<Response>,
  ): Response | Promise<Response>;
}

export interface Middleware {
  handler(
    req: Request,
    handle: () => Promise<Response>,
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
