import { ComponentType } from "../runtime/deps.ts";
import { router } from "./deps.ts";
import { PageProps } from "../runtime/types.ts";

export interface PageModule {
  default: ComponentType<PageProps>;
}

export interface Page {
  route: string;
  url: string;
  name: string;
  component: ComponentType<PageProps>;
}

export type ApiRouteModule = {
  [K in "default" | typeof router.METHODS[number]]?: router.MatchHandler;
};

export interface ApiRoute {
  route: string;
  url: string;
  name: string;
  handlers: Record<string, router.MatchHandler>;
}
