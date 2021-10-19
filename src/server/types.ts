import { ComponentType } from "../runtime/deps.ts";
import { router } from "./deps.ts";
import { PageConfig, PageProps } from "../runtime/types.ts";
import { RenderContext, RenderFn } from "./render.tsx";

export interface PageModule {
  default?: ComponentType<PageProps>;
  handler?: Handler | Handlers;
  config?: PageConfig;
}

export interface HandlerContext {
  req: Request;
  match: Record<string, string>;
  render?: () => Promise<Response>;
}

export type Handler = (ctx: HandlerContext) => Response | Promise<Response>;

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
}

export interface RendererModule {
  render(ctx: RenderContext, render: RenderFn): void;
}

export interface Renderer {
  render(ctx: RenderContext, render: RenderFn): void;
}
