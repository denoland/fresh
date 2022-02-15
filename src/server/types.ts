import { ComponentType } from "../runtime/deps.ts";
import { router } from "./deps.ts";
import {
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

export interface HandlerContext {
  req: Request;
  match: Record<string, string>;
  render?: (args?: Record<string, unknown>) => Promise<Response>;
}

export interface UnknownHandlerContext {
  req: Request;
  render?: () => Promise<Response>;
}

export interface ErrorHandlerContext {
  req: Request;
  error: unknown;
  render?: () => Promise<Response>;
}

export type Handler = (ctx: HandlerContext) => Response | Promise<Response>;
export type UnknownHandler = (
  ctx: UnknownHandlerContext,
) => Response | Promise<Response>;
export type ErrorHandler = (
  ctx: ErrorHandlerContext,
) => Response | Promise<Response>;

export type Handlers = {
  [K in typeof router.METHODS[number]]?: Handler;
};

export interface Page {
  route: string;
  url: string;
  name: string;
  component?: ComponentType<PageProps>;
  handler: Handler | Handlers;
  runtimeJS: boolean;
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
